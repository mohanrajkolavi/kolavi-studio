import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { spawn } from "child_process";
import path from "path";

const SCRIPT_PATH = path.join(process.cwd(), "content_audit", "run_audit.py");
const TIMEOUT_MS = 60_000;
const PYTHON_CMDS = ["python3", "python"] as const;

const UNAVAILABLE_MESSAGE =
  "Python content audit not available. Install Python 3 and run: pip install -r content_audit/requirements.txt (see content_audit/README.md).";

/** Run the audit script with the given Python command; rejects if process fails to start. Returns promise and a kill function for timeout. */
function runWithPython(
  pythonCmd: string,
  payload: string
): {
  promise: Promise<{ stdout: string; stderr: string; code: number | null }>;
  kill: () => void;
} {
  let py: ReturnType<typeof spawn> | null = null;
  const promise = new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
    py = spawn(pythonCmd, [SCRIPT_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";
    py.stdout.setEncoding("utf8");
    py.stderr.setEncoding("utf8");
    py.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    py.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    py.on("error", (err) => reject(err));
    py.on("close", (code) => resolve({ stdout, stderr, code }));

    py.stdin.write(payload);
    py.stdin.end();
  });
  const kill = () => {
    if (py) py.kill("SIGKILL");
  };
  return { promise, kill };
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; content?: string; html?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : "";
  const content = typeof body.content === "string" ? body.content : "";
  const html = typeof body.html === "string" ? body.html : content;

  if (!content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const payload = JSON.stringify({ title, content, html });

  // Try python3 first, then python (e.g. Windows or some envs only have "python")
  let lastSpawnError: Error | null = null;
  for (const pythonCmd of PYTHON_CMDS) {
    const { promise, kill } = runWithPython(pythonCmd, payload);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const result = await Promise.race([
        promise,
        new Promise<never>((_, rej) => {
          timeoutId = setTimeout(() => {
            kill();
            rej(new Error("timeout"));
          }, TIMEOUT_MS);
        }),
      ]);
      if (timeoutId) clearTimeout(timeoutId);
      const { stdout, stderr, code } = result;
      if (code !== 0 && !stdout) {
        return NextResponse.json(
          {
            error: "Content audit script failed.",
            detail: stderr || `Exit code ${code}`,
          },
          { status: 502 }
        );
      }
      const data = JSON.parse(stdout) as {
        ok?: boolean;
        error?: string;
        results?: unknown;
      };
      if (!data.ok && data.error) {
        return NextResponse.json({ error: data.error }, { status: 502 });
      }
      return NextResponse.json(data);
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.message === "timeout") {
          return NextResponse.json(
            {
              error: "Content audit timed out. Install Python deps and try again.",
            },
            { status: 504 }
          );
        }
        lastSpawnError = err;
      }
      // Spawn failed (e.g. ENOENT); try next Python command
      continue;
    }
  }

  return NextResponse.json(
    {
      error: UNAVAILABLE_MESSAGE,
      detail: lastSpawnError?.message,
    },
    { status: 503 }
  );
}
