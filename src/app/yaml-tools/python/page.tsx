import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/python";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/python";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "YAML in Python: PyYAML, safe_load, and ruamel.yaml (2026 Guide)",
  description:
    "Read, write, and manipulate YAML in Python. Complete guide to PyYAML safe_load, dump, ruamel.yaml, common errors, and best practices with copy-ready examples.",
  path: PAGE_PATH,
  keywords:
    "python yaml, yaml python, python read yaml, python import yaml, python yaml package, pyyaml, ruamel.yaml, python parse yaml, python write yaml",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const installSnippet = `# PyYAML is the de-facto YAML library for Python
pip install pyyaml

# Verify
python -c "import yaml; print(yaml.__version__)"
`;

const loadFile = `import yaml

with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

print(config["database"]["host"])
`;

const loadString = `import yaml

raw = """
name: my-app
version: 1.4.2
features:
  - search
  - billing
"""

data = yaml.safe_load(raw)
print(data["features"])  # ['search', 'billing']
`;

const safeVsFull = `import yaml

# SAFE - rejects arbitrary Python objects, recommended default
data = yaml.safe_load(stream)

# UNSAFE - can construct arbitrary Python objects, only use on trusted input
data = yaml.full_load(stream)   # equivalent to yaml.load(stream, Loader=yaml.FullLoader)
data = yaml.load(stream, Loader=yaml.UnsafeLoader)  # never use on untrusted YAML
`;

const dumpDict = `import yaml

config = {
    "name": "my-app",
    "version": "1.4.2",
    "features": ["search", "analytics"],
    "database": {"host": "db.example.com", "port": 5432},
}

# Pretty-printed YAML
print(yaml.safe_dump(config, sort_keys=False, default_flow_style=False))
`;

const multiDoc = `import yaml

# YAML files can contain multiple documents separated by ---
documents = """
---
kind: Deployment
metadata:
  name: api
---
kind: Service
metadata:
  name: api
"""

for doc in yaml.safe_load_all(documents):
    print(doc["kind"], doc["metadata"]["name"])
`;

const ruamelExample = `# ruamel.yaml preserves comments and round-trips cleanly
pip install ruamel.yaml

# In Python:
from ruamel.yaml import YAML

yaml = YAML()           # round-trip mode by default
with open("config.yaml") as f:
    data = yaml.load(f)

# Mutate in place
data["replicas"] = 5

with open("config.yaml", "w") as f:
    yaml.dump(data, f)
# Comments survive!
`;

const errorHandling = `import yaml

try:
    data = yaml.safe_load(text)
except yaml.YAMLError as e:
    if hasattr(e, "problem_mark"):
        mark = e.problem_mark
        print(f"YAML error at line {mark.line + 1}, column {mark.column + 1}: {e.problem}")
    else:
        print(f"YAML error: {e}")
`;

const FAQS = [
  {
    question: "How do I read a YAML file in Python?",
    answer:
      "Install PyYAML with 'pip install pyyaml', then open the file and call yaml.safe_load(). Example: with open('config.yaml') as f: data = yaml.safe_load(f). The result is a regular Python dict, list, or scalar.",
  },
  {
    question: "What is the difference between yaml.load and yaml.safe_load?",
    answer:
      "yaml.safe_load only constructs basic Python types (dict, list, str, int, float, bool, None) and is safe on untrusted input. yaml.load (or yaml.full_load) can construct arbitrary Python objects and should only be used on trusted YAML. Default to safe_load.",
  },
  {
    question: "How do I write a Python dict to YAML?",
    answer:
      "Use yaml.safe_dump(data). For human-readable output, pass default_flow_style=False (block style) and sort_keys=False to preserve insertion order. Example: yaml.safe_dump(data, default_flow_style=False, sort_keys=False).",
  },
  {
    question: "What is the Python YAML package called?",
    answer:
      "The PyPI package is called 'pyyaml' but the import name is 'yaml'. Install it with 'pip install pyyaml', then use 'import yaml' in your code. The mismatch is a common source of confusion.",
  },
  {
    question: "How do I handle multiple YAML documents in one file?",
    answer:
      "Use yaml.safe_load_all() instead of safe_load. It returns a generator that yields each document separated by '---'. This is the standard pattern for Kubernetes manifests and multi-document config files.",
  },
  {
    question: "Should I use PyYAML or ruamel.yaml?",
    answer:
      "Use PyYAML for simple read/write cases where comments and ordering do not matter. Use ruamel.yaml when you need to round-trip files (load, edit, save) while preserving comments, key order, and original formatting.",
  },
  {
    question: "How do I get line and column numbers from YAML errors in Python?",
    answer:
      "Catch yaml.YAMLError and check hasattr(e, 'problem_mark'). The mark has 'line' and 'column' attributes (zero-indexed). Add 1 to display them as one-indexed for human readability.",
  },
  {
    question: "Why does yaml.safe_load return None for empty input?",
    answer:
      "An empty string or whitespace-only YAML is valid and represents the YAML null value, which Python maps to None. Always handle the None case in your code, especially when loading user-provided files that might be empty.",
  },
  {
    question: "How do I parse YAML strings (not files) in Python?",
    answer:
      "yaml.safe_load() accepts both file objects and strings. Just pass the string directly: data = yaml.safe_load('name: app\\nversion: 1.0'). Behavior is identical to loading from a file.",
  },
  {
    question: "Does PyYAML support YAML 1.2?",
    answer:
      "PyYAML 6.x targets YAML 1.1 by default. Some YAML 1.2 features (like the merge key '<<:') are partially supported but boolean parsing may differ. For full YAML 1.2 compliance, use ruamel.yaml in YAML 1.2 mode.",
  },
  {
    question: "How do I install PyYAML in a virtual environment?",
    answer:
      "Activate the venv first ('source .venv/bin/activate' on macOS / Linux, '.venv\\\\Scripts\\\\activate' on Windows), then run 'pip install pyyaml'. Verify with 'python -c \"import yaml\"'. If installation seems successful but import fails, see our 'No module named yaml' troubleshooting guide.",
  },
  {
    question: "Can I edit a YAML file and preserve its comments in Python?",
    answer:
      "Yes, with ruamel.yaml. PyYAML drops all comments on load. Use 'from ruamel.yaml import YAML' and the default round-trip mode preserves comments, key order, and formatting through load -> mutate -> dump.",
  },
];

export default function YamlPythonPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML in Python", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "YAML in Python: PyYAML, safe_load, and ruamel.yaml",
    description:
      "Complete guide to reading, writing, and manipulating YAML in Python with PyYAML and ruamel.yaml.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1900,
  });

  const howToSchema = getHowToSchema({
    name: "How to read a YAML file in Python",
    description:
      "Steps to read, parse, and access YAML data in Python using PyYAML.",
    totalTime: "PT2M",
    steps: [
      {
        name: "Install PyYAML",
        text: "Run 'pip install pyyaml'. The PyPI package is named pyyaml even though the import name is yaml.",
      },
      {
        name: "Open the file",
        text: "Use Python's built-in open() to read the YAML file. UTF-8 is the standard YAML encoding.",
      },
      {
        name: "Parse with safe_load",
        text: "Call yaml.safe_load(f) on the file object. The return value is a Python dict, list, or scalar.",
      },
      {
        name: "Access values",
        text: "Treat the parsed data like any Python dict or list. Use dict[key] or list[index] to read values.",
      },
      {
        name: "Handle errors",
        text: "Wrap in try/except yaml.YAMLError and inspect e.problem_mark for the line and column of any syntax error.",
      },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article>
          <header className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">
              {LAST_UPDATED_LABEL}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              YAML in Python: A Practical Guide
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Read, write, and manipulate YAML in Python with PyYAML and
              ruamel.yaml. Includes the safe_load vs load distinction, common
              errors, and when to pick each library.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Written by{" "}
              <Link href={AUTHOR_URL} className="underline hover:text-foreground">
                {AUTHOR_NAME}
              </Link>
              .
            </p>
          </header>

          <div className="mb-10 rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-semibold mb-2">
              Quick answer: read YAML in Python
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Install PyYAML with <code>pip install pyyaml</code>, then call{" "}
              <code>yaml.safe_load(stream)</code> where <code>stream</code> is a
              file object or a string. The result is a regular Python dict,
              list, or scalar. Always prefer <code>safe_load</code> over{" "}
              <code>load</code> on untrusted input.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="install">Installing PyYAML</h2>
            <p>
              The Python YAML library lives on PyPI as <code>pyyaml</code> but
              imports as <code>yaml</code> — a naming mismatch that trips up
              most newcomers:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  install.sh
                </span>
                <CopyButton content={installSnippet} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {installSnippet}
              </pre>
            </div>
            <p>
              If <code>import yaml</code> fails after install, see our{" "}
              <Link
                href="/yaml-tools/no-module-named-yaml"
                className="text-primary hover:underline"
              >
                No module named &apos;yaml&apos; troubleshooting guide
              </Link>
              .
            </p>

            <h2 id="read-file">Reading a YAML file</h2>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  load_file.py
                </span>
                <CopyButton content={loadFile} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {loadFile}
              </pre>
            </div>
            <p>
              The return value of <code>yaml.safe_load</code> is a regular
              Python data structure — typically a dict at the top level, but
              could be a list or scalar depending on the YAML.
            </p>

            <h2 id="read-string">Parsing a YAML string</h2>
            <p>
              <code>safe_load</code> accepts both file objects and strings:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  load_string.py
                </span>
                <CopyButton content={loadString} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {loadString}
              </pre>
            </div>

            <h2 id="safe-vs-full">safe_load vs load vs full_load</h2>
            <p>
              PyYAML offers multiple loaders. They differ only in which Python
              objects they will construct from YAML tags:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  loaders.py
                </span>
                <CopyButton content={safeVsFull} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {safeVsFull}
              </pre>
            </div>
            <p>
              <strong>Rule of thumb:</strong> always use <code>safe_load</code>{" "}
              unless you have a specific reason and the YAML source is fully
              trusted. <code>yaml.load</code> with the default loader can
              execute arbitrary Python via crafted YAML tags — a known CVE
              vector.
            </p>

            <h2 id="dump">Writing YAML from Python</h2>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  dump.py
                </span>
                <CopyButton content={dumpDict} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {dumpDict}
              </pre>
            </div>
            <p>
              Pass <code>default_flow_style=False</code> for human-readable
              block style and <code>sort_keys=False</code> to preserve
              insertion order (PyYAML alphabetizes by default).
            </p>

            <h2 id="multi-document">Multiple documents in one file</h2>
            <p>
              Kubernetes manifests and Compose-style files often pack multiple
              YAML documents in a single file separated by{" "}
              <code>---</code>. Use <code>safe_load_all</code>:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  multi_doc.py
                </span>
                <CopyButton content={multiDoc} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {multiDoc}
              </pre>
            </div>

            <h2 id="ruamel">ruamel.yaml: round-tripping with comments</h2>
            <p>
              PyYAML drops comments and reorders keys on round-trip. If you
              need to load, edit, and save a file while preserving its
              formatting and comments, switch to <code>ruamel.yaml</code>:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  ruamel_example.py
                </span>
                <CopyButton content={ruamelExample} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {ruamelExample}
              </pre>
            </div>

            <h2 id="errors">Handling YAML errors with line numbers</h2>
            <p>
              When YAML fails to parse, the exception carries a{" "}
              <code>problem_mark</code> with line and column info:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  error_handling.py
                </span>
                <CopyButton content={errorHandling} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {errorHandling}
              </pre>
            </div>

            <h2 id="library-comparison">PyYAML vs ruamel.yaml at a glance</h2>
            <div className="not-prose overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold">PyYAML</th>
                    <th className="px-4 py-3 text-left font-semibold">ruamel.yaml</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3 font-medium">Spec compliance</td>
                    <td className="px-4 py-3">YAML 1.1 (mostly)</td>
                    <td className="px-4 py-3">YAML 1.2 full</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Preserve comments</td>
                    <td className="px-4 py-3">No</td>
                    <td className="px-4 py-3">Yes (round-trip mode)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Preserve key order</td>
                    <td className="px-4 py-3">Optional via sort_keys=False</td>
                    <td className="px-4 py-3">Default</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Speed</td>
                    <td className="px-4 py-3">Faster (with libyaml)</td>
                    <td className="px-4 py-3">Slower in round-trip mode</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Maturity</td>
                    <td className="px-4 py-3">De-facto default</td>
                    <td className="px-4 py-3">Newer, actively maintained</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Best for</td>
                    <td className="px-4 py-3">Read-only or write-only</td>
                    <td className="px-4 py-3">Edit-in-place workflows</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="best-practices">Best practices</h2>
            <ul>
              <li>
                <strong>Always use safe_load on untrusted input.</strong>{" "}
                <code>yaml.load</code> with the default loader is a remote-code
                execution vector.
              </li>
              <li>
                <strong>Set sort_keys=False on dump.</strong> Default
                alphabetization makes diffs unstable for human-edited config.
              </li>
              <li>
                <strong>Pin the version in requirements.txt.</strong> PyYAML
                between 5.x and 6.x changed several defaults.
              </li>
              <li>
                <strong>Use ruamel.yaml when comments matter.</strong> Don&apos;t
                fight PyYAML on round-trips — it will lose comments every time.
              </li>
              <li>
                <strong>Validate before deploy.</strong> Drop generated YAML
                into our{" "}
                <Link
                  href="/yaml-validator"
                  className="text-primary hover:underline"
                >
                  YAML validator
                </Link>{" "}
                to catch issues before kubectl or docker compose runs.
              </li>
            </ul>

            <h2 id="related">Related YAML guides</h2>
            <ul>
              <li>
                <Link
                  href="/yaml-tools/no-module-named-yaml"
                  className="text-primary hover:underline"
                >
                  Fix: ModuleNotFoundError: No module named &apos;yaml&apos;
                </Link>
              </li>
              <li>
                <Link
                  href="/yaml-tools/syntax"
                  className="text-primary hover:underline"
                >
                  YAML syntax reference
                </Link>
              </li>
              <li>
                <Link
                  href="/yaml-tools/anchors"
                  className="text-primary hover:underline"
                >
                  YAML anchors and aliases
                </Link>{" "}
                — important when parsing Compose-style YAML in Python.
              </li>
              <li>
                <Link
                  href="/yaml-validator"
                  className="text-primary hover:underline"
                >
                  YAML validator
                </Link>{" "}
                — sanity-check files before Python parses them.
              </li>
            </ul>
          </div>

          <section id="faqs" className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.question} className="rounded-lg border p-5">
                  <h3 className="text-base font-semibold mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </article>

        <YamlToolFooter currentPath={PAGE_PATH} />
      </div>
    </>
  );
}
