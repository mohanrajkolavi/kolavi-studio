import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { spawn } from "child_process";
import path from "path";

const SCRIPT_PATH = path.join(process.cwd(), "content_audit", "run_audit.py");
const TIMEOUT_MS = 60_000;

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

  return new Promise<NextResponse>((resolve) => {
    const py = spawn("python3", [SCRIPT_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: process.cwd(),
    });

    const timeout = setTimeout(() => {
      py.kill("SIGKILL");
      resolve(
        NextResponse.json(
          { error: "Content audit timed out. Install Python deps and try again." },
          { status: 504 }
        )
      );
    }, TIMEOUT_MS);

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

    py.on("error", (err) => {
      clearTimeout(timeout);
      resolve(
        NextResponse.json(
          {
            error: "Python content audit not available.",
            detail: err.message,
          },
          { status: 503 }
        )
      );
    });

    py.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0 && !stdout) {
        resolve(
          NextResponse.json(
            {
              error: "Content audit script failed.",
              detail: stderr || `Exit code ${code}`,
            },
            { status: 502 }
          )
        );
        return;
      }
      try {
        const data = JSON.parse(stdout) as { ok?: boolean; error?: string; results?: unknown };
        if (!data.ok && data.error) {
          resolve(
            NextResponse.json({ error: data.error }, { status: 502 })
          );
          return;
        }
        resolve(NextResponse.json(data));
      } catch {
        resolve(
          NextResponse.json(
            { error: "Invalid output from content audit.", detail: stdout.slice(0, 500) },
            { status: 502 }
          )
        );
      }
    });

    py.stdin.write(payload);
    py.stdin.end();
  });
}
