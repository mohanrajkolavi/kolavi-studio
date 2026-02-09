"""
GoogleQualityAuditor: E-E-A-T and content integrity checks based on Google's
"Helpful Content" guidelines. Uses nltk, textblob/vader, regex, spacy, and BeautifulSoup.
"""

import re
from dataclasses import dataclass, field
from typing import Optional

# Optional deps: fail with clear message if missing
try:
    import nltk
except ImportError:
    nltk = None
try:
    from textblob import TextBlob
except ImportError:
    TextBlob = None
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:
    SentimentIntensityAnalyzer = None
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None
try:
    import spacy
except ImportError:
    spacy = None

# Ensure NLTK data (run once: nltk.download("punkt") and/or "punkt_tab" for newer nltk)
if nltk is not None:
    for resource in ("punkt", "punkt_tab"):
        try:
            nltk.data.find(f"tokenizers/{resource}")
        except LookupError:
            try:
                nltk.download(resource, quiet=True)
            except Exception:
                pass

# Lazy-load spacy model
_nlp = None

def _get_nlp():
    global _nlp
    if _nlp is None and spacy is not None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            try:
                import subprocess
                subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=False)
                _nlp = spacy.load("en_core_web_sm")
            except Exception:
                _nlp = None
    return _nlp


# --- Experience signals (E-E-A-T) ---
FIRST_PERSON_PRONOUNS = {
    "i", "we", "my", "our", "mine", "us",
    "i'm", "we're", "i've", "we've", "i'll", "we'll", "i'd", "we'd",
}
# Second-person / general experience pronouns (blog prompts use "you/anyone" style)
EXPERIENCE_PRONOUNS = {
    "you", "your", "you're", "you've", "you'll", "you'd",
}
ACTION_PROOF_VERBS = {
    "tested", "tried", "used", "verified", "analyzed", "bought", "saw",
    "test", "try", "use", "verify", "analyze", "buy", "see",
    "testing", "trying", "using", "verified", "analyzing",
    "noticed", "notice", "experienced", "experience", "compared",
    "built", "build", "ran", "run", "switched", "switch",
    "implemented", "set up", "configured", "installed", "deployed",
}
# Phrase-level patterns that signal firsthand experience (match the blog prompt's signals)
# Support both contractions ("who's", "you've") and expanded forms ("who has", "you have")
EXPERIENCE_PHRASE_PATTERNS = [
    r"\banyone who(?:'s| has| has ever)\b",
    r"\bif you(?:'ve|'ve ever| have| have ever)\b",
    r"\bwalk into any\b",
    r"\bafter (?:using|trying|testing|spending|running|working)\b",
    r"\bthe (?:moment|first time|difference becomes)\b.{0,30}\byou\b",
    r"\bfrom (?:my|our) experience\b",
    r"\bin (?:my|our) experience\b",
    r"\bhands-on\b",
    r"\bfirsthand\b",
    r"\bfirst-hand\b",
    r"\bask anyone who\b",
    r"\byou(?:'ll| will) (?:notice|see|find|recognize|know|understand)\b",
    r"\byou start to (?:notice|see|realize)\b",
    r"\byou(?:'ve| have) (?:probably |likely )?(?:seen|noticed|heard|experienced)\b",
    r"\bonce you (?:try|use|test|start|get|see)\b",
    r"\bspend .{0,20} (?:with|using|on|in)\b.{0,30}\byou(?:'ll| will)\b",
]

# --- Clickbait ---
CLICKBAIT_WORDS = [
    "insane", "shocking", "miracle", "secret", "dead", "killer", "ultimate",
]

# --- Data density: citation markers ---
CITATION_PATTERNS = [
    r"\baccording to\b",
    r"\bstudy showed\b",
    r"\bstudies show\b",
    r"\bresearch by\b",
    r"\bresearch shows\b",
    r"\bresearch from\b",
    r"\bdata from\b",
    r"\breport(?:ed|s)?\s+(?:by|from|that)\b",
    r"\bfindings\s+(?:from|show)\b",
]


@dataclass
class ExperienceSignalsResult:
    score: float
    experience_sentences: list[str] = field(default_factory=list)


@dataclass
class TitleHyperboleResult:
    is_clickbait: bool
    trigger_word: Optional[str] = None
    sentiment_polarity: Optional[float] = None
    sentiment_trigger: Optional[str] = None  # "too_positive" | "too_negative" | None


@dataclass
class DataDensityResult:
    density_score: float
    data_point_count: int
    word_count: int


@dataclass
class ProblematicSection:
    section_label: str
    word_count: int
    issue: str  # "too_thin" | "wall_of_text"


@dataclass
class SkimmabilityResult:
    pass_fail: str  # "pass" | "fail"
    problematic_sections: list[ProblematicSection] = field(default_factory=list)


@dataclass
class TemporalConsistencyResult:
    consistency_score: str  # "pass" | "fail"
    title_year: Optional[int] = None
    stale_year_references: list[str] = field(default_factory=list)


@dataclass
class BuriedAnswer:
    heading_text: str
    first_sentence: str
    word_count: int


@dataclass
class AnswerFirstStructureResult:
    direct_answer_ratio: float
    buried_answers: list[BuriedAnswer] = field(default_factory=list)
    total_questions: int = 0


@dataclass
class EntityDensityResult:
    density_percent: float
    top_entities: list[tuple[str, str]] = field(default_factory=list)  # (text, label)
    unique_entity_count: int = 0
    skipped_reason: Optional[str] = None  # set when spacy not available


@dataclass
class ReadabilityVarianceResult:
    variance_score: str  # "pass" | "fail" or a brief summary
    fatigue_sentences: list[str] = field(default_factory=list)
    monotony_detected: bool = False


class GoogleQualityAuditor:
    """
    Analyzes text for E-E-A-T and content integrity signals per Google Helpful Content guidelines.
    """

    def __init__(self):
        self._vader = SentimentIntensityAnalyzer() if SentimentIntensityAnalyzer else None

    def _require_nltk(self):
        if nltk is None:
            raise RuntimeError("nltk is required. Install with: pip install nltk")

    def _require_sentiment(self):
        if TextBlob is None and self._vader is None:
            raise RuntimeError("textblob or vaderSentiment required. pip install textblob vaderSentiment")

    def _require_bs4(self):
        if BeautifulSoup is None:
            raise RuntimeError("beautifulsoup4 is required. pip install beautifulsoup4")

    def _require_spacy(self):
        if spacy is None:
            raise RuntimeError("spacy is required. pip install spacy && python -m spacy download en_core_web_sm")
        nlp = _get_nlp()
        if nlp is None:
            raise RuntimeError("spacy model en_core_web_sm not found. Run: python -m spacy download en_core_web_sm")

    # ---------- Prompt 1: Quality & Trust (E-E-A-T) ----------

    def check_experience_signals(self, text: str) -> ExperienceSignalsResult:
        """
        Identify experience signals: sentences with (first-person OR second-person/anyone)
        + action/proof verbs, OR sentences matching known experience-signal phrase patterns.
        Score = % of sentences that qualify.
        """
        self._require_nltk()
        if not text or not text.strip():
            return ExperienceSignalsResult(score=0.0, experience_sentences=[])

        sentences = nltk.sent_tokenize(text)
        experience_sentences = []
        for sent in sentences:
            sent_lower = sent.lower()
            words = set(re.findall(r"\b[a-z']+\b", sent_lower))

            # Check pronoun + action verb (first-person OR second-person)
            has_any_pronoun = bool(words & FIRST_PERSON_PRONOUNS) or bool(words & EXPERIENCE_PRONOUNS)
            has_verb = bool(words & ACTION_PROOF_VERBS)
            pronoun_verb_match = has_any_pronoun and has_verb

            # Check phrase-level patterns (e.g. "anyone who's tried", "if you've ever")
            phrase_match = any(re.search(p, sent_lower) for p in EXPERIENCE_PHRASE_PATTERNS)

            if pronoun_verb_match or phrase_match:
                experience_sentences.append(sent.strip())

        # Absolute scoring: 3 experience signals = 100%. Matches the prompt's "2-3 per article" target.
        # Old formula (percentage of all sentences) penalized long articles unfairly.
        count = len(experience_sentences)
        score = min(count, 3) / 3.0 * 100.0
        return ExperienceSignalsResult(score=round(score, 1), experience_sentences=experience_sentences)

    def check_title_hyperbole(self, title: str) -> TitleHyperboleResult:
        """
        Sentiment: flag if polarity > 0.8 or < -0.8. Flag clickbait words.
        """
        self._require_sentiment()
        trigger_word = None
        sentiment_polarity = None
        sentiment_trigger = None

        title_lower = title.lower()
        for w in CLICKBAIT_WORDS:
            if re.search(r"\b" + re.escape(w) + r"\b", title_lower):
                trigger_word = w
                break

        if TextBlob is not None:
            blob = TextBlob(title)
            sentiment_polarity = blob.sentiment.polarity
        elif self._vader is not None:
            comp = self._vader.polarity_scores(title)
            sentiment_polarity = comp["compound"]

        if sentiment_polarity is not None:
            if sentiment_polarity > 0.8:
                sentiment_trigger = "too_positive"
            elif sentiment_polarity < -0.8:
                sentiment_trigger = "too_negative"

        is_clickbait = trigger_word is not None or sentiment_trigger is not None
        return TitleHyperboleResult(
            is_clickbait=is_clickbait,
            trigger_word=trigger_word,
            sentiment_polarity=round(sentiment_polarity, 3) if sentiment_polarity is not None else None,
            sentiment_trigger=sentiment_trigger,
        )

    def check_data_density(self, text: str) -> DataDensityResult:
        """
        Count numbers/stats and citation markers; density per 100 words.
        """
        if not text or not text.strip():
            return DataDensityResult(density_score=0.0, data_point_count=0, word_count=0)

        words = re.findall(r"\S+", text)
        word_count = len(words)

        # Hard data: percentages, currency, "Nx" multipliers, standalone numbers (e.g. "45%", "$500", "3.5x")
        stats = 0
        stats += len(re.findall(r"\d+(?:\.\d+)?\s*%", text))
        stats += len(re.findall(r"\$\s*\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?\s*\$", text))
        stats += len(re.findall(r"\d+(?:\.\d+)?\s*x\b", text, re.I))
        # Other numeric stats (e.g. "3.5 million", "2024")
        stats += len(re.findall(r"\b\d+(?:\.\d+)?\s*(?:million|billion|percent|%)", text, re.I))

        for pat in CITATION_PATTERNS:
            stats += len(re.findall(pat, text, re.I))

        density_per_100 = (stats / word_count * 100) if word_count else 0.0
        return DataDensityResult(
            density_score=round(density_per_100, 2),
            data_point_count=stats,
            word_count=word_count,
        )

    # FAQ heading patterns — sections under these are intentionally short (FAQ answers)
    # Uses "contains" match so "Frequently Asked Questions about X" also matches.
    _FAQ_HEADING_RE = re.compile(
        r"(?i)(?:frequently\s+asked\s+questions|(?:^|\b)faqs?(?:\b|$)|common\s+questions)"
    )

    # Summary / table / takeaway sections are intentionally concise — exempt from too_thin.
    _SUMMARY_HEADING_RE = re.compile(
        r"(?i)(?:key\s+takeaway|at\s+a\s+glance|summary|matrix|overview\s+table|quick\s+summary|tl\s*;?\s*dr|swot\s+(?:matrix|table))"
    )

    # Step / process / how-to section titles often have short intro prose before lists — exempt from too_thin.
    _STEP_HEADING_RE = re.compile(
        r"(?i)(?:step(?:\s*[-:]?\s*\d+|\s+by\s+step|\s*[-–]\s*)|identify\s+\w+|synthesize\s+\w+|analyze\s+\w+|evaluate\s+\w+|how\s+to\s+conduct|conduct\s+a\s+\w+)"
    )

    @staticmethod
    def _is_faq_heading(label: str) -> bool:
        """Return True if the heading text looks like an FAQ section title."""
        return bool(GoogleQualityAuditor._FAQ_HEADING_RE.search(label.strip().rstrip("?")))

    @staticmethod
    def _is_summary_heading(label: str) -> bool:
        """Return True if the heading is a summary/table/takeaway section (intentionally short)."""
        return bool(GoogleQualityAuditor._SUMMARY_HEADING_RE.search(label.strip()))

    @staticmethod
    def _is_step_heading(label: str) -> bool:
        """Return True if the heading is a step/process/how-to section (often short intro before lists)."""
        return bool(GoogleQualityAuditor._STEP_HEADING_RE.search(label.strip()))

    def check_skimmability(self, text: str, html_content: Optional[str] = None) -> SkimmabilityResult:
        """
        Split by H2/H3; flag sections < 50 words (too thin) or > 300 words (wall of text).
        Uses html_content if provided (BeautifulSoup), else parses text as markdown-style (## / ###).
        FAQ Q&A sections (H3s under an FAQ H2) are exempt from the too_thin check
        because short answers are by design.
        """
        problematic = []
        # (label, body, tag_name) — tag_name is "h2"/"h3" or None
        sections: list[tuple[str, str, Optional[str]]] = []

        if html_content and (BeautifulSoup is not None):
            self._require_bs4()
            soup = BeautifulSoup(html_content, "html.parser")
            for tag in soup.find_all(["h2", "h3"]):
                label = tag.get_text(strip=True)
                body_parts = []
                for sib in tag.find_next_siblings():
                    if sib.name in ("h2", "h3"):
                        break
                    if sib.name == "p":
                        body_parts.append(sib.get_text(separator=" ", strip=True))
                body = " ".join(body_parts)
                sections.append((label, body, tag.name))
            # If no headings, treat whole as one section
            if not sections and soup.get_text(strip=True):
                sections.append(("(no headings)", soup.get_text(separator=" ", strip=True), None))
        else:
            # Markdown-style: split by ## or ###
            parts = re.split(r"(?m)^#{2,3}\s+.+$", text)
            heading_matches = list(re.finditer(r"(?m)^(#{2,3}\s+.+)$", text))
            if heading_matches:
                for i, m in enumerate(heading_matches):
                    raw = m.group(1)
                    label = raw.lstrip("#").strip()
                    tag_name = "h2" if raw.startswith("## ") and not raw.startswith("### ") else "h3"
                    body = parts[i + 1].strip() if i + 1 < len(parts) else ""
                    sections.append((label, body, tag_name))
            else:
                if text.strip():
                    sections.append(("(no headings)", text.strip(), None))

        # Track whether we're inside an FAQ block (H2 = FAQ heading; ends at next H2)
        in_faq = False
        for label, body, tag_name in sections:
            if tag_name == "h2":
                in_faq = self._is_faq_heading(label)
            wc = len(re.findall(r"\S+", body))
            if wc < 50:
                # Skip too_thin for FAQ Q&A sections — short answers are by design
                # Skip too_thin for summary/table/takeaway sections — concise by design
                # Skip too_thin for step/process/how-to headings — often short intro before lists
                if not in_faq and not self._is_summary_heading(label) and not self._is_step_heading(label):
                    problematic.append(ProblematicSection(section_label=label, word_count=wc, issue="too_thin"))
            elif wc > 300:
                problematic.append(ProblematicSection(section_label=label, word_count=wc, issue="wall_of_text"))

        pass_fail = "fail" if problematic else "pass"
        return SkimmabilityResult(pass_fail=pass_fail, problematic_sections=problematic)

    # ---------- Prompt 2: Integrity & Architecture ----------

    # Contextual year patterns — years in these phrases are legitimate historical references
    _YEAR_CONTEXT_RE = re.compile(
        r"(?:founded|established|launched|started|introduced|since|fiscal\s+year|fy)\s+(?:in\s+)?\d{4}",
        re.I,
    )

    def check_temporal_consistency(self, title: str, text: str) -> TemporalConsistencyResult:
        """
        Extract year from title; flag mentions of years 3+ years older than title year.
        Years within 2 years (e.g. 2023, 2024 in a 2025 article) are recent context, not stale.
        Years in known contextual patterns (founded in, since, fiscal year) are exempt.
        """
        title_year = None
        m = re.search(r"\b(19\d{2}|20\d{2})\b", title)
        if m:
            title_year = int(m.group(1))

        stale_refs = []
        if title_year is not None and text:
            # Build set of years that appear in contextual patterns (exempt)
            context_years: set[int] = set()
            for cm in self._YEAR_CONTEXT_RE.finditer(text):
                ym = re.search(r"\b(19\d{2}|20\d{2})\b", cm.group())
                if ym:
                    context_years.add(int(ym.group(1)))

            # Flag years 3+ years older than title year (allow 2 years back as recent context)
            for m in re.finditer(r"\b(19\d{2}|20\d{2})\b", text):
                y = int(m.group(1))
                if y < title_year - 2 and y not in context_years:
                    stale_refs.append(m.group(0))

        consistency_score = "fail" if stale_refs else "pass"
        return TemporalConsistencyResult(
            consistency_score=consistency_score,
            title_year=title_year,
            stale_year_references=stale_refs,
        )

    def check_answer_first_structure(self, html_content: str) -> AnswerFirstStructureResult:
        """
        Find H2/H3 that start with What/How/Who/Why/Where; check next <p> first sentence <= 30 words.
        """
        self._require_bs4()
        if not html_content or not html_content.strip():
            return AnswerFirstStructureResult(direct_answer_ratio=0.0, buried_answers=[], total_questions=0)

        soup = BeautifulSoup(html_content, "html.parser")
        question_start = re.compile(r"^\s*(what|how|who|why|where)\b", re.I)
        buried = []
        direct_count = 0
        total_questions = 0

        for tag in soup.find_all(["h2", "h3"]):
            heading_text = tag.get_text(strip=True)
            if not question_start.search(heading_text):
                continue
            total_questions += 1
            first_p = tag.find_next("p")
            if first_p is None:
                buried.append(BuriedAnswer(heading_text=heading_text, first_sentence="", word_count=0))
                continue
            first_p_text = first_p.get_text(separator=" ", strip=True)
            if not first_p_text:
                buried.append(BuriedAnswer(heading_text=heading_text, first_sentence="", word_count=0))
                continue
            first_sentence = first_p_text.split(".")[0].strip()
            if first_sentence and not first_sentence.endswith("."):
                first_sentence += "."
            wc = len(re.findall(r"\S+", first_sentence))
            if wc <= 30:
                direct_count += 1
            else:
                buried.append(BuriedAnswer(heading_text=heading_text, first_sentence=first_sentence, word_count=wc))

        ratio = (direct_count / total_questions * 100.0) if total_questions else 0.0
        return AnswerFirstStructureResult(
            direct_answer_ratio=round(ratio, 1),
            buried_answers=buried,
            total_questions=total_questions,
        )

    def check_entity_density(self, text: str) -> EntityDensityResult:
        """
        spacy NER: ORG, PRODUCT, GPE, PERSON, EVENT. Density = (unique entities / words) * 100.
        If spacy or en_core_web_sm is not installed, returns skipped_reason (optional check).
        """
        try:
            self._require_spacy()
            nlp = _get_nlp()
            if nlp is None:
                return EntityDensityResult(
                    density_percent=0.0,
                    top_entities=[],
                    unique_entity_count=0,
                    skipped_reason="Install: pip install spacy && python -m spacy download en_core_web_sm",
                )
        except RuntimeError as e:
            return EntityDensityResult(
                density_percent=0.0,
                top_entities=[],
                unique_entity_count=0,
                skipped_reason="Install: pip install spacy && python -m spacy download en_core_web_sm",
            )
        if not text or not text.strip():
            return EntityDensityResult(density_percent=0.0, top_entities=[], unique_entity_count=0)

        doc = nlp(text[:1_000_000])
        words = len(list(doc))
        keep_labels = {"ORG", "PRODUCT", "GPE", "PERSON", "EVENT"}
        seen = set()
        entities: list[tuple[str, str]] = []
        for ent in doc.ents:
            if ent.label_ in keep_labels and ent.text.strip():
                key = (ent.text.strip(), ent.label_)
                if key not in seen:
                    seen.add(key)
                    entities.append((ent.text.strip(), ent.label_))

        density = (len(seen) / words * 100) if words else 0.0
        top5 = entities[:5]
        return EntityDensityResult(
            density_percent=round(density, 2),
            top_entities=top5,
            unique_entity_count=len(seen),
        )

    def check_readability_variance(self, text: str) -> ReadabilityVarianceResult:
        """
        Sentence length variance: flag 5+ consecutive sentences within ±2 words (monotony);
        flag any sentence > 40 words (fatigue).
        """
        self._require_nltk()
        if not text or not text.strip():
            return ReadabilityVarianceResult(variance_score="pass", fatigue_sentences=[], monotony_detected=False)

        sentences = nltk.sent_tokenize(text)
        lengths = [len(re.findall(r"\S+", s)) for s in sentences]
        fatigue_sentences = [s for s, L in zip(sentences, lengths) if L > 40]
        monotony = False
        for i in range(len(lengths) - 4):
            window = lengths[i : i + 5]
            if max(window) - min(window) <= 2:
                monotony = True
                break

        variance_score = "fail" if (fatigue_sentences or monotony) else "pass"
        return ReadabilityVarianceResult(
            variance_score=variance_score,
            fatigue_sentences=fatigue_sentences,
            monotony_detected=monotony,
        )
