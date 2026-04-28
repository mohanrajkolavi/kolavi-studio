import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/kubernetes";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/kubernetes";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "Kubernetes Deployment YAML: Examples & Reference (2026)",
  description:
    "Anatomy of Kubernetes Deployment, Service, ConfigMap, and Secret YAML manifests. Copy-ready Nginx example, common errors, and kubectl apply tips.",
  path: PAGE_PATH,
  keywords:
    "kubernetes deployment yaml, kubernetes deployment yaml example nginx, k8s yaml, kubernetes manifest, kubectl apply yaml, kubernetes yaml example",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const nginxDeployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
`;

const nginxService = `apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: ClusterIP
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
`;

const configMap = `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: info
  FEATURE_FLAGS: "search,recommendations"
  config.yaml: |
    server:
      port: 8080
      timeout: 30s
`;

const secret = `apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgres://user:pass@db:5432/app"
  API_KEY: "sk_live_xxxxxxxxxxxxx"
`;

const probesAndEnv = `# Same Deployment with health probes and env from ConfigMap + Secret
spec:
  template:
    spec:
      containers:
        - name: api
          image: myorg/api:1.4.2
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
`;

const multiDoc = `# Multiple resources in one file - separated by ---
apiVersion: v1
kind: Namespace
metadata:
  name: production
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
`;

const FAQS = [
  {
    question: "What is a Kubernetes deployment YAML?",
    answer:
      "A Kubernetes deployment YAML is a manifest file (typically with a .yaml or .yml extension) that declares a Deployment resource. It tells the Kubernetes control plane which container image to run, how many replicas to maintain, the rolling-update strategy, and the pod template. Apply it with 'kubectl apply -f deployment.yaml'.",
  },
  {
    question: "What are the four required fields in every Kubernetes manifest?",
    answer:
      "Every manifest must include 'apiVersion' (the Kubernetes API group and version), 'kind' (the resource type, e.g. Deployment, Service), 'metadata' (at minimum a name, plus optional labels and namespace), and 'spec' (the desired state for that kind of resource).",
  },
  {
    question: "What is the apiVersion for a Kubernetes Deployment?",
    answer:
      "Use 'apps/v1'. The older 'extensions/v1beta1' and 'apps/v1beta1' versions are deprecated and removed in modern clusters. ConfigMap, Service, Secret, and Namespace use 'v1' (the core API group).",
  },
  {
    question: "How many replicas should I set in a Kubernetes Deployment?",
    answer:
      "Start with three for production-grade web services - that survives a single node failure and allows zero-downtime rolling updates. Use one for stateful or singleton workloads. The replicas field can be changed later with 'kubectl scale' or by editing the YAML and re-applying.",
  },
  {
    question: "How do I apply a Kubernetes YAML file?",
    answer:
      "Run 'kubectl apply -f deployment.yaml' to create or update the resources defined in the file. 'kubectl apply -f .' applies every YAML in the current directory. Use 'kubectl diff -f file.yaml' to preview the change before applying.",
  },
  {
    question: "What is the difference between 'kubectl apply' and 'kubectl create'?",
    answer:
      "'kubectl create' fails if the resource already exists. 'kubectl apply' creates the resource if absent and patches it if present, using a three-way merge between the YAML, the live object, and the last-applied annotation. Apply is the recommended choice for almost all GitOps and declarative workflows.",
  },
  {
    question: "How do I pass environment variables to a Kubernetes container?",
    answer:
      "Three options: hardcode under spec.template.spec.containers[].env (each entry has a name and value), reference a ConfigMap or Secret per-key with valueFrom.configMapKeyRef or valueFrom.secretKeyRef, or pull every key from a ConfigMap/Secret with envFrom.configMapRef or envFrom.secretRef.",
  },
  {
    question: "How do I set CPU and memory limits in a Deployment YAML?",
    answer:
      "Add a resources block under each container. 'requests' is what the scheduler reserves; 'limits' is the maximum the container can use. CPU is measured in cores or millicores ('500m' = 0.5 CPU). Memory uses Mi (mebibytes) or Gi (gibibytes). Always set both requests and limits in production.",
  },
  {
    question: "How do I put multiple Kubernetes resources in one YAML file?",
    answer:
      "Separate documents with a line containing only three dashes (---). Each document is parsed as a complete manifest. 'kubectl apply -f file.yaml' processes every document in order. This is the standard way to ship a Deployment plus its Service plus its ConfigMap as a single artifact.",
  },
  {
    question: "Why does my Kubernetes YAML get rejected with 'error validating data'?",
    answer:
      "The most common causes are wrong apiVersion or kind, indentation issues (always two spaces, never tabs), unknown fields under spec, missing required fields like 'selector' on a Deployment, or quoting numeric strings incorrectly. Run 'kubectl apply --dry-run=client -f file.yaml' to validate before applying for real.",
  },
  {
    question: "Should I store Kubernetes Secrets as YAML in Git?",
    answer:
      "Plain Secret manifests are base64-encoded, not encrypted - committing them is equivalent to committing plaintext. Use Sealed Secrets, External Secrets Operator, SOPS-encrypted YAML, or an external secret manager (Vault, AWS Secrets Manager) and reference it from your deployment instead.",
  },
  {
    question: "What is the difference between containerPort, port, and targetPort?",
    answer:
      "'containerPort' is the port the container listens on inside the pod. 'port' is the port the Service exposes inside the cluster. 'targetPort' is the pod port the Service forwards to (defaults to 'port' if omitted, but should match the container's containerPort). Get all three right or traffic does not reach the pod.",
  },
];

export default function YamlKubernetesPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "Kubernetes YAML", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "Kubernetes Deployment YAML: Anatomy with Copy-Ready Examples",
    description:
      "Field-by-field walkthrough of Kubernetes Deployment, Service, ConfigMap, and Secret manifests with a working Nginx example.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1800,
  });

  const howToSchema = getHowToSchema({
    name: "How to write and apply a Kubernetes Deployment YAML",
    description:
      "Author a Deployment manifest, validate it, and roll it out with kubectl.",
    totalTime: "PT5M",
    steps: [
      {
        name: "Pick the apiVersion and kind",
        text: "Use apiVersion 'apps/v1' and kind 'Deployment'. Add metadata.name and a label.",
      },
      {
        name: "Define replicas and selector",
        text: "Set spec.replicas (3 is a sensible default) and spec.selector.matchLabels to a label that matches your pod template.",
      },
      {
        name: "Author the pod template",
        text: "Under spec.template.spec.containers, set image, ports, resource requests and limits, env vars, and probes.",
      },
      {
        name: "Validate and apply",
        text: "Run 'kubectl apply --dry-run=client -f file.yaml' to validate, then 'kubectl apply -f file.yaml' to roll out.",
      },
      {
        name: "Verify the rollout",
        text: "Run 'kubectl rollout status deployment/<name>' to wait for healthy pods and 'kubectl get pods' to inspect the running replicas.",
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
              Kubernetes Deployment YAML
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Field-by-field anatomy of a Kubernetes Deployment manifest, plus
              the Service, ConfigMap, and Secret YAML you almost always need
              alongside it. Copy-ready Nginx example included.
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
            <h2 className="text-base font-semibold mb-2">Quick answer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A Kubernetes Deployment YAML uses{" "}
              <code>apiVersion: apps/v1</code>, <code>kind: Deployment</code>,
              a <code>metadata.name</code>, and a <code>spec</code> with{" "}
              <code>replicas</code>, a <code>selector</code>, and a pod{" "}
              <code>template</code> defining containers and their image,
              ports, resources, env, and probes. Apply it with{" "}
              <code>kubectl apply -f deployment.yaml</code>.
            </p>
          </div>

          <nav className="mb-10 rounded-lg border border-border bg-muted/30 p-5">
            <p className="text-sm font-semibold mb-2">On this page</p>
            <ul className="text-sm space-y-1">
              <li>
                <a href="#nginx-deployment" className="text-primary hover:underline">
                  Nginx Deployment example
                </a>
              </li>
              <li>
                <a href="#service" className="text-primary hover:underline">
                  Service manifest
                </a>
              </li>
              <li>
                <a href="#configmap" className="text-primary hover:underline">
                  ConfigMap example
                </a>
              </li>
              <li>
                <a href="#secret" className="text-primary hover:underline">
                  Secret example
                </a>
              </li>
              <li>
                <a href="#probes-env" className="text-primary hover:underline">
                  Probes and env injection
                </a>
              </li>
              <li>
                <a href="#multi-doc" className="text-primary hover:underline">
                  Multiple resources in one file
                </a>
              </li>
              <li>
                <a href="#kubectl-apply" className="text-primary hover:underline">
                  Applying with kubectl
                </a>
              </li>
              <li>
                <a href="#errors" className="text-primary hover:underline">
                  Common errors
                </a>
              </li>
              <li>
                <a href="#faqs" className="text-primary hover:underline">
                  FAQs
                </a>
              </li>
            </ul>
          </nav>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="nginx-deployment">Nginx Deployment example</h2>
            <p>
              A complete, working Deployment that runs three Nginx replicas
              with sensible CPU and memory bounds:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  nginx-deployment.yaml
                </span>
                <CopyButton content={nginxDeployment} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {nginxDeployment}
              </pre>
            </div>
            <p>
              Field-by-field:
            </p>
            <ul>
              <li>
                <code>apiVersion: apps/v1</code> - the API group and version
                for Deployments.
              </li>
              <li>
                <code>kind: Deployment</code> - the resource type.
              </li>
              <li>
                <code>metadata.name</code> - unique within the namespace.
              </li>
              <li>
                <code>spec.replicas: 3</code> - desired pod count.
              </li>
              <li>
                <code>spec.selector.matchLabels</code> - must match the
                labels in <code>spec.template.metadata.labels</code>, or the
                Deployment will not own its pods.
              </li>
              <li>
                <code>spec.template</code> - the pod template, used to create
                each replica.
              </li>
              <li>
                <code>resources.requests</code> / <code>limits</code> - what
                the scheduler reserves and the maximum the container can
                consume.
              </li>
            </ul>

            <h2 id="service">Service manifest</h2>
            <p>
              A Deployment without a Service is unreachable from anywhere
              except the pod itself. The matching <code>ClusterIP</code>{" "}
              Service routes traffic to any pod with the{" "}
              <code>app: nginx</code> label:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  nginx-service.yaml
                </span>
                <CopyButton content={nginxService} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {nginxService}
              </pre>
            </div>
            <p>
              <code>port</code> is what other workloads in the cluster call.{" "}
              <code>targetPort</code> is the pod port traffic is forwarded to.
              Use <code>type: NodePort</code> or <code>LoadBalancer</code> to
              expose the service outside the cluster.
            </p>

            <h2 id="configmap">ConfigMap example</h2>
            <p>
              A ConfigMap stores non-secret configuration as key-value pairs,
              with optional embedded YAML or JSON files:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  configmap.yaml
                </span>
                <CopyButton content={configMap} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {configMap}
              </pre>
            </div>
            <p>
              The <code>config.yaml</code> entry uses a literal block scalar
              (<code>|</code>) to embed a multiline value. See the{" "}
              <Link
                href="/yaml-tools/multiline-strings"
                className="text-primary hover:underline"
              >
                multiline strings guide
              </Link>{" "}
              for the full block-scalar reference.
            </p>

            <h2 id="secret">Secret example</h2>
            <p>
              <code>stringData</code> takes plaintext that Kubernetes
              base64-encodes when it stores the Secret. Use this form rather
              than <code>data</code> (which expects values to already be
              base64) to keep the YAML readable:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  secret.yaml
                </span>
                <CopyButton content={secret} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {secret}
              </pre>
            </div>
            <p>
              <strong>Do not</strong> commit raw Secret manifests to Git -
              base64 is encoding, not encryption. Use Sealed Secrets, External
              Secrets Operator, or SOPS to handle them safely.
            </p>

            <h2 id="probes-env">Probes and environment injection</h2>
            <p>
              Production-grade Deployments wire env vars from a ConfigMap and
              Secret, and expose readiness and liveness probes so Kubernetes
              can stop sending traffic to broken pods:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  probes-env.yaml (excerpt)
                </span>
                <CopyButton content={probesAndEnv} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {probesAndEnv}
              </pre>
            </div>
            <p>
              <code>readinessProbe</code> controls when traffic is routed to
              the pod. <code>livenessProbe</code> controls when the kubelet
              restarts the pod. Set both - they answer different questions.
            </p>

            <h2 id="multi-doc">Multiple resources in one file</h2>
            <p>
              YAML supports multiple documents in a single file separated by{" "}
              <code>---</code>. This is how a single manifest ships a
              Namespace, Deployment, Service, and ConfigMap together:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  bundle.yaml
                </span>
                <CopyButton content={multiDoc} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {multiDoc}
              </pre>
            </div>

            <h2 id="kubectl-apply">Applying with kubectl</h2>
            <ul>
              <li>
                <code>kubectl apply -f file.yaml</code> - create or update
                from a single file.
              </li>
              <li>
                <code>kubectl apply -f .</code> - apply every YAML in the
                directory.
              </li>
              <li>
                <code>kubectl apply --dry-run=client -f file.yaml</code> -
                validate without contacting the cluster.
              </li>
              <li>
                <code>kubectl diff -f file.yaml</code> - preview the change
                that apply would make.
              </li>
              <li>
                <code>kubectl rollout status deployment/&lt;name&gt;</code> -
                wait for the new replicas to become healthy.
              </li>
              <li>
                <code>kubectl rollout undo deployment/&lt;name&gt;</code> -
                roll back to the previous revision.
              </li>
            </ul>

            <h2 id="errors">Common errors</h2>
            <ul>
              <li>
                <strong>error validating data: unknown field "X"</strong> -
                typo in a field name, or wrong API version. Check the{" "}
                <code>apiVersion</code> first.
              </li>
              <li>
                <strong>spec.selector: required value</strong> - Deployments
                require <code>spec.selector.matchLabels</code> matching the
                pod template's labels.
              </li>
              <li>
                <strong>found character that cannot start any token</strong>{" "}
                - tabs in indentation. YAML rejects tabs; use two spaces. Run
                the file through the{" "}
                <Link
                  href="/yaml-validator"
                  className="text-primary hover:underline"
                >
                  YAML validator
                </Link>{" "}
                to find the exact line.
              </li>
              <li>
                <strong>ImagePullBackOff</strong> - not a YAML problem; check
                the image name, tag, and pull secret.
              </li>
              <li>
                <strong>CrashLoopBackOff</strong> - container starts and
                exits. Inspect logs with <code>kubectl logs &lt;pod&gt;</code>{" "}
                and check the readiness probe.
              </li>
            </ul>

            <h2 id="related">Validate and convert</h2>
            <p>
              Indentation bugs in Kubernetes YAML are silent until apply
              time. Drop your manifest into the{" "}
              <Link
                href="/yaml-validator"
                className="text-primary hover:underline"
              >
                YAML validator
              </Link>{" "}
              before running kubectl, or use the{" "}
              <Link
                href="/yaml-formatter"
                className="text-primary hover:underline"
              >
                YAML formatter
              </Link>{" "}
              to normalize indentation across a repo. For shared blocks
              across multiple manifests, see{" "}
              <Link
                href="/yaml-tools/anchors"
                className="text-primary hover:underline"
              >
                YAML anchors and merge keys
              </Link>
              .
            </p>
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
