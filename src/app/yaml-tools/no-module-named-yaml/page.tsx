import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/no-module-named-yaml";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/no-module-named-yaml";
const DATE_PUBLISHED = "2026-04-27T00:00:00Z";
const DATE_MODIFIED = "2026-04-27T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 27, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "Fix: ModuleNotFoundError: No module named 'yaml' (Python 2026)",
  description:
    "Fix the Python ImportError 'No module named yaml' in seconds. Covers pip install pyyaml, virtual environments, Conda, macOS path issues, and Docker.",
  path: PAGE_PATH,
  keywords:
    "modulenotfounderror: no module named 'yaml', no module named yaml, no module named 'yaml', pip install yaml, install pyyaml, python no module named yaml, importerror no module named yaml",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const errorTraceback = `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    import yaml
ModuleNotFoundError: No module named 'yaml'
`;

const fixPip = `# The package is called pyyaml, not yaml
pip install pyyaml

# Or, with python3 explicitly
python3 -m pip install pyyaml
`;

const fixVenv = `# Activate the virtual environment first
source .venv/bin/activate           # macOS / Linux
.\\.venv\\Scripts\\activate           # Windows PowerShell

# Then install
pip install pyyaml

# Verify
python -c "import yaml; print(yaml.__version__)"
`;

const fixConda = `# Conda environments
conda activate myenv
conda install pyyaml

# Or with conda-forge
conda install -c conda-forge pyyaml
`;

const fixDocker = `# Add to your Dockerfile
RUN pip install --no-cache-dir pyyaml

# Or in requirements.txt
echo "pyyaml>=6.0" >> requirements.txt
docker build -t myapp .
`;

const fixWhichPython = `# Confirm which python pip is installing into
python -c "import sys; print(sys.executable)"
which python
which pip

# If they point to different installs, force the same one
python -m pip install pyyaml
`;

const FAQS = [
  {
    question: "Why does Python say 'No module named yaml'?",
    answer:
      "Python's PyYAML package is not installed in the interpreter you are running. The package is called 'pyyaml' on PyPI but the import name is 'yaml', which causes confusion. Install it with: pip install pyyaml.",
  },
  {
    question: "Is the pip package called yaml or pyyaml?",
    answer:
      "The pip package is called pyyaml. Running 'pip install yaml' may fail or install a different unrelated package. Always use 'pip install pyyaml'. After installation you import it as 'import yaml'.",
  },
  {
    question: "What if pip install pyyaml says 'already satisfied' but I still get the error?",
    answer:
      "You almost certainly have multiple Python installations. The pip command installed PyYAML into a different interpreter than the one running your script. Run 'python -m pip install pyyaml' to install into the same interpreter you use to run code.",
  },
  {
    question: "How do I install PyYAML in a virtual environment?",
    answer:
      "Activate the venv first (source .venv/bin/activate on macOS / Linux, .venv\\Scripts\\activate on Windows). Then run 'pip install pyyaml'. Verify with 'python -c \"import yaml\"'. If activation is missing, the install goes into the system Python, not the venv.",
  },
  {
    question: "How do I install PyYAML in Conda?",
    answer:
      "Activate the Conda environment with 'conda activate myenv', then 'conda install pyyaml'. Conda will use its own packages instead of pip-installed ones. For the latest version, use 'conda install -c conda-forge pyyaml'.",
  },
  {
    question: "Why does this error appear on macOS even after installing?",
    answer:
      "macOS ships with a system Python that is read-only protected. pip may install into a user directory that is not on the script's path, or a Homebrew-installed Python may take precedence. Always use 'python3 -m pip install --user pyyaml' or a virtual environment to avoid this.",
  },
  {
    question: "How do I fix this in a Docker container?",
    answer:
      "Add 'RUN pip install --no-cache-dir pyyaml' to your Dockerfile, or include 'pyyaml' in requirements.txt and rebuild the image. The error appears at runtime if the package was not installed during the image build.",
  },
  {
    question: "Does PyYAML have a C extension that needs separate install?",
    answer:
      "PyYAML installs a pure-Python implementation by default. Optional C bindings (libyaml-dev) speed up parsing but are not required for the import to work. The 'No module named yaml' error means the Python wrapper itself is missing.",
  },
  {
    question: "Will ruamel.yaml fix this error?",
    answer:
      "ruamel.yaml is a different package and uses 'import ruamel.yaml', not 'import yaml'. Installing it does not provide the 'yaml' module. To fix the original ImportError, install pyyaml with 'pip install pyyaml'.",
  },
  {
    question: "How do I check if PyYAML is installed correctly?",
    answer:
      "Run 'python -c \"import yaml; print(yaml.__version__)\"'. If it prints a version number (e.g. 6.0.1), PyYAML is correctly installed and importable. If it raises ModuleNotFoundError, the install did not target the active interpreter.",
  },
];

export default function NoModuleNamedYamlPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "No module named 'yaml'", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "ModuleNotFoundError: No module named 'yaml' - How to Fix",
    description:
      "Step-by-step fix for the Python ImportError 'No module named yaml' covering pip, venv, Conda, macOS, and Docker.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1500,
  });

  const howToSchema = getHowToSchema({
    name: "How to fix ModuleNotFoundError: No module named 'yaml'",
    description:
      "Resolve the Python ImportError when the yaml module is missing.",
    totalTime: "PT2M",
    steps: [
      {
        name: "Install PyYAML",
        text: "Run pip install pyyaml. The package on PyPI is called pyyaml even though the import name is yaml.",
      },
      {
        name: "Match the interpreter",
        text: "If pip says 'already satisfied' but the error persists, run python -m pip install pyyaml so the install targets the same Python that runs your script.",
      },
      {
        name: "Activate your virtual environment",
        text: "If you use venv or virtualenv, activate it before installing. Otherwise the install goes into the system Python.",
      },
      {
        name: "Verify the install",
        text: "Run python -c 'import yaml; print(yaml.__version__)'. A version number confirms PyYAML is importable.",
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
              Fix: ModuleNotFoundError: No module named &apos;yaml&apos;
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The fastest fix for the Python ImportError, plus how to handle
              the trickier cases involving virtual environments, Conda, macOS
              system Python, and Docker.
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
              Quick fix: install PyYAML
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Run <code>pip install pyyaml</code>. The PyPI package is called{" "}
              <code>pyyaml</code> even though the Python import name is{" "}
              <code>yaml</code>. If pip says &quot;already satisfied&quot; but
              you still see the error, run{" "}
              <code>python -m pip install pyyaml</code> to make sure the
              install goes into the same interpreter that runs your script.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="error">The error you are seeing</h2>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  traceback
                </span>
                <CopyButton content={errorTraceback} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {errorTraceback}
              </pre>
            </div>
            <p>
              This error means Python successfully started, found your script,
              hit <code>import yaml</code>, and could not find a package named{" "}
              <code>yaml</code> on its module search path. The fix is to
              install <code>pyyaml</code>, which provides the <code>yaml</code>
              module.
            </p>

            <h2 id="fix-1">Fix 1: pip install pyyaml</h2>
            <p>
              The most common case. Note that the PyPI package name and the
              import name differ:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  install.sh
                </span>
                <CopyButton content={fixPip} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {fixPip}
              </pre>
            </div>
            <p>
              <code>pip install yaml</code> will not work - that name does not
              point to PyYAML on PyPI.
            </p>

            <h2 id="fix-2">Fix 2: virtual environments</h2>
            <p>
              If you use a virtual environment, activate it <em>before</em>{" "}
              installing PyYAML. Otherwise the package goes into the system
              Python and your venv keeps failing:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  venv-install.sh
                </span>
                <CopyButton content={fixVenv} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {fixVenv}
              </pre>
            </div>
            <p>
              The <code>(myenv)</code> prefix in your shell prompt confirms the
              venv is active. If it is missing, run the activate command again.
            </p>

            <h2 id="fix-3">Fix 3: Conda environments</h2>
            <p>
              Conda manages its own package set. If you mix pip and conda in
              the same env, you can still hit this error because conda may not
              recognize pip-installed packages until refreshed:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  conda-install.sh
                </span>
                <CopyButton content={fixConda} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {fixConda}
              </pre>
            </div>

            <h2 id="fix-4">Fix 4: which python is pip targeting?</h2>
            <p>
              The trickiest case is when pip <em>says</em> the package is
              installed but the import still fails. That happens when pip is
              attached to one Python install while your script runs under a
              different one. Diagnose like this:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  diagnose.sh
                </span>
                <CopyButton content={fixWhichPython} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {fixWhichPython}
              </pre>
            </div>
            <p>
              On macOS this is especially common because you may have system
              Python at <code>/usr/bin/python3</code>, Homebrew Python at{" "}
              <code>/opt/homebrew/bin/python3</code>, and a pyenv-managed
              Python on top. <code>python -m pip install</code> always
              targets the interpreter you ran <code>python</code> with, so
              prefer it over a bare <code>pip install</code>.
            </p>

            <h2 id="fix-5">Fix 5: Docker images</h2>
            <p>
              If your container hits the error at runtime, the image was built
              without PyYAML. Add it to the Dockerfile or requirements.txt and
              rebuild:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Dockerfile
                </span>
                <CopyButton content={fixDocker} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {fixDocker}
              </pre>
            </div>

            <h2 id="ruamel">Should I use ruamel.yaml instead?</h2>
            <p>
              <code>ruamel.yaml</code> is a YAML 1.2 compliant alternative to
              PyYAML. It preserves comments and round-trips cleanly, which
              PyYAML does not. But its import name is{" "}
              <code>ruamel.yaml</code>, not <code>yaml</code>, so installing
              it does not fix the original error. If your existing code uses{" "}
              <code>import yaml</code>, install <code>pyyaml</code>. If you
              are starting fresh and need comment preservation, consider{" "}
              <code>ruamel.yaml</code> instead.
            </p>

            <h2 id="verify">Verify the fix</h2>
            <p>After installing, confirm everything is wired up correctly:</p>
            <ol>
              <li>
                <code>python -c &quot;import yaml; print(yaml.__version__)&quot;</code>{" "}
                prints a version number (e.g. 6.0.1).
              </li>
              <li>
                Re-run your script. The <code>ModuleNotFoundError</code>{" "}
                should be gone.
              </li>
              <li>
                If the error returns later, check that the same venv or Conda
                env is still active.
              </li>
            </ol>

            <h2 id="related">Related YAML guides</h2>
            <ul>
              <li>
                <Link
                  href="/yaml-validator"
                  className="text-primary hover:underline"
                >
                  YAML validator
                </Link>{" "}
                - check syntax of any YAML file in your browser before
                Python parses it.
              </li>
              <li>
                <Link
                  href="/yaml-to-json"
                  className="text-primary hover:underline"
                >
                  YAML to JSON converter
                </Link>{" "}
                - useful when comparing PyYAML output to expected JSON.
              </li>
              <li>
                <Link
                  href="/yaml-guide"
                  className="text-primary hover:underline"
                >
                  Complete YAML guide
                </Link>{" "}
                - YAML syntax, file format, and use cases.
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
