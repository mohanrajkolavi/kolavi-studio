"""
Lazy Writing Auditor: Flags robotic transitions, hollow hype words, and AI-tell phrases
that make content feel generic or unhelpful. Replaces "AI detection" with actionable
quality signals—Google penalizes low-value content, not AI authorship.
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional
# AI models overuse these connector words; humans rarely write this formally in web content.
ROBOTIC_TRANSITIONS = [
    "In conclusion",
    "It is important to note",
    "Furthermore",
    "Moreover",
    "In summary",
    "In the rapidly evolving",
    "To summarize",
    "A testament to",
]

# Empty calories: take up space but add no specific meaning. Prefer concrete details over hype.
HOLLOW_HYPE = [
    "Game-changer",
    "Revolutionize",
    "Unleash",
    "Unlock",
    "Elevate",
    "Cutting-edge",
    "Seamless",
    "Supercharge",
    "Next-level",
]

# Statistically overrepresented in LLM training data; signal generic rather than expert voice.
AI_TELLS = [
    "Delve",
    "Landscape",
    "Tapestry",
    "Realm",
    "Foster",
    "Nuanced",
    "Crucial",
    "Paramount",
]


@dataclass
class LazyPhrasingResult:
    """Result from check_lazy_phrasing."""

    score: float  # fluff_density_score = (total matches / word count) * 100
    found_transitions: list[str] = field(default_factory=list)
    found_hype: list[str] = field(default_factory=list)
    found_tells: list[str] = field(default_factory=list)


@dataclass
class SentenceStartResult:
    """Result from audit_sentence_starts."""

    is_repetitive: bool
    repeating_word: Optional[str] = None


class LazyWritingAuditor:
    """
    Flags robotic transitions, hollow hype, and AI-tell phrases that reduce content quality.
    Aim for fluff_density_score < 1%. Higher scores suggest editing for punchier, more
    specific language.
    """

    def __init__(
        self,
        robotic_transitions: Optional[List[str]] = None,
        hollow_hype: Optional[List[str]] = None,
        ai_tells: Optional[List[str]] = None,
    ):
        self.robotic_transitions = robotic_transitions or ROBOTIC_TRANSITIONS.copy()
        self.hollow_hype = hollow_hype or HOLLOW_HYPE.copy()
        self.ai_tells = ai_tells or AI_TELLS.copy()

    def check_lazy_phrasing(self, text: str) -> LazyPhrasingResult:
        """
        Scan text for robotic transitions, hollow hype, and AI-tell phrases.
        Returns density score and lists of matched phrases. Aim for score < 1%.
        """
        if not text or not text.strip():
            return LazyPhrasingResult(
                score=0.0,
                found_transitions=[],
                found_hype=[],
                found_tells=[],
            )

        words = re.findall(r"\S+", text)
        word_count = len(words)
        found_transitions: list[str] = []
        found_hype: list[str] = []
        found_tells: list[str] = []

        for phrase in self.robotic_transitions:
            pattern = re.escape(phrase)
            matches = re.findall(pattern, text, re.IGNORECASE)
            found_transitions.extend(matches)

        for phrase in self.hollow_hype:
            pattern = re.escape(phrase)
            matches = re.findall(pattern, text, re.IGNORECASE)
            found_hype.extend(matches)

        for phrase in self.ai_tells:
            pattern = r"\b" + re.escape(phrase) + r"\b"
            matches = re.findall(pattern, text, re.IGNORECASE)
            found_tells.extend(matches)

        total_matches = len(found_transitions) + len(found_hype) + len(found_tells)
        fluff_density_score = (total_matches / word_count * 100) if word_count else 0.0

        return LazyPhrasingResult(
            score=round(fluff_density_score, 2),
            found_transitions=found_transitions,
            found_hype=found_hype,
            found_tells=found_tells,
        )

    # Common articles/pronouns that are hard to avoid in analytical content.
    # Only flag repetitive starts with more distinctive words.
    EXEMPT_STARTS = {"the", "it", "its", "this", "that", "these", "those", "a", "an"}

    def audit_sentence_starts(self, text: str) -> SentenceStartResult:
        """
        Check if 3+ sentences in a row start with the same word
        (e.g. "Apple... Apple... Apple..."). Indicates monotonous structure.
        Aligned with blog generator prompt: "Don't start more than 2 sentences in a row the same way."
        Common articles/pronouns (the, it, this, etc.) are exempt since they're unavoidable
        in analytical writing.
        """
        if not text or not text.strip():
            return SentenceStartResult(is_repetitive=False, repeating_word=None)

        sentences = re.split(r"[.!?]+", text)
        sentence_starts: list[str] = []
        for s in sentences:
            s = s.strip()
            if not s:
                continue
            m = re.match(r"^[\"\"''\[\(]*([A-Za-z]+)", s)
            if m:
                sentence_starts.append(m.group(1).lower())

        # Flag when 3 consecutive sentences start with the same word (> 2 in a row)
        # but exempt common articles/pronouns
        for i in range(len(sentence_starts) - 2):
            window = sentence_starts[i : i + 3]
            if len(set(window)) == 1 and window[0] not in self.EXEMPT_STARTS:
                return SentenceStartResult(
                    is_repetitive=True,
                    repeating_word=window[0],
                )

        return SentenceStartResult(is_repetitive=False, repeating_word=None)
