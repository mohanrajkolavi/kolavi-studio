# Content Audit (E-E-A-T & Integrity)

Python-based content audit for Google's "Helpful Content" guidelines. The `GoogleQualityAuditor` class provides:

- **Quality & Trust (E-E-A-T):** experience signals, title hyperbole, data density, skimmability
- **Integrity & Architecture:** temporal consistency, answer-first structure, entity density, readability variance

## Setup

```bash
cd content_audit
pip install -r requirements.txt
python -m nltk.downloader punkt
python -m spacy download en_core_web_sm
```

## Usage

```python
from content_audit import GoogleQualityAuditor

auditor = GoogleQualityAuditor()

# Quality & Trust
exp = auditor.check_experience_signals(article_text)
title_check = auditor.check_title_hyperbole("The Ultimate Secret to Insane Results")
density = auditor.check_data_density(article_text)
skim = auditor.check_skimmability(article_text, html_content=optional_html)

# Integrity & Architecture
temporal = auditor.check_temporal_consistency("Best Tools 2026", article_text)
answer_first = auditor.check_answer_first_structure(html_content)
entities = auditor.check_entity_density(article_text)
variance = auditor.check_readability_variance(article_text)
```

## Integration with this repo

- **In-app SEO audit:** The main app uses TypeScript audits in `src/lib/seo/article-audit.ts` (used by the Content Writer dashboard and by the pipeline).
- **API:** `POST /api/content-audit/quality` can run quality/E-E-A-T–related checks on submitted HTML and metadata.
- **This Python module** can be run standalone (e.g. from scripts or a separate service). Results can be consumed via stdout/JSON or by calling the Python process from Node if needed.
