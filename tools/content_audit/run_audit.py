#!/usr/bin/env python3
"""
Run GoogleQualityAuditor from JSON stdin; print JSON result to stdout.
Used by the Next.js API route POST /api/content-audit/quality.
"""
import json
import os
import re
import sys
from dataclasses import asdict

# When run as python3 tools/content_audit/run_audit.py, tools/ must be on path for content_audit import
_script_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_script_dir)  # tools/ - parent of content_audit package
if _root not in sys.path:
    sys.path.insert(0, _root)

if __name__ == "__main__":
    try:
        payload = json.load(sys.stdin)
    except Exception as e:
        json.dump({"ok": False, "error": f"Invalid JSON: {e}"}, sys.stdout)
        sys.exit(1)

    title = (payload.get("title") or "").strip()
    content = (payload.get("content") or "").strip()
    html = (payload.get("html") or content).strip()

    def html_to_plain(s: str) -> str:
        s = re.sub(r"<[^>]+>", " ", s)
        s = re.sub(r"\s+", " ", s)
        return s.strip()

    plain_text = html_to_plain(content) if content else ""

    try:
        from content_audit.google_quality_auditor import GoogleQualityAuditor
        from content_audit.lazy_writing_auditor import LazyWritingAuditor
    except ImportError:
        try:
            from google_quality_auditor import GoogleQualityAuditor
            from lazy_writing_auditor import LazyWritingAuditor
        except ImportError:
            json.dump({"ok": False, "error": "GoogleQualityAuditor not found. Install content_audit deps."}, sys.stdout)
            sys.exit(1)

    auditor = GoogleQualityAuditor()
    lazy_auditor = LazyWritingAuditor()
    out = {}

    def run(name: str, fn, *args, **kwargs):
        try:
            r = fn(*args, **kwargs)
            out[name] = asdict(r) if hasattr(r, "__dataclass_fields__") else r
        except Exception as e:
            out[name] = {"error": str(e)}

    # Quality & Trust
    run("experience_signals", auditor.check_experience_signals, plain_text)
    run("title_hyperbole", auditor.check_title_hyperbole, title)
    run("data_density", auditor.check_data_density, plain_text)
    run("skimmability", auditor.check_skimmability, plain_text, html or None)

    # Integrity & Architecture
    run("temporal_consistency", auditor.check_temporal_consistency, title, plain_text)
    run("answer_first_structure", auditor.check_answer_first_structure, html or content)
    run("entity_density", auditor.check_entity_density, plain_text)
    run("readability_variance", auditor.check_readability_variance, plain_text)

    # Lazy Writing Auditor (replaces AI detection; flags robotic phrasing)
    run("lazy_phrasing", lazy_auditor.check_lazy_phrasing, plain_text)
    run("sentence_starts", lazy_auditor.audit_sentence_starts, plain_text)

    # entity_density has top_entities as list of [text, label]; asdict makes them lists
    if "entity_density" in out and "top_entities" in out["entity_density"]:
        out["entity_density"]["top_entities"] = [
            [t, l] for t, l in out["entity_density"]["top_entities"]
        ]

    json.dump({"ok": True, "results": out}, sys.stdout)
