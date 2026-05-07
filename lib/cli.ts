import { spawn } from "node:child_process";
import { ensureInsideProjectRoot } from "./paths";
import type { CliKind } from "./schemas";

export type CliInvocation = {
  cli: CliKind;
  executable: string;
  args: string[];
  workdir: string;
  stdin?: string;
  commandPreview: string;
};

function quoteForDisplay(value: string) {
  if (/^[\w:./\\-]+$/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

export function buildCliInvocation(input: {
  cli: CliKind;
  projectDir: string;
  promptText: string;
}) {
  const workdir = ensureInsideProjectRoot(input.projectDir);

  if (input.cli === "codex") {
    const args = [
      "exec",
      "--cd",
      workdir,
      "--sandbox",
      "workspace-write",
      "--ask-for-approval",
      "on-request",
      "-",
    ];

    return {
      cli: input.cli,
      executable: "codex",
      args,
      workdir,
      stdin: input.promptText,
      commandPreview: ["codex", ...args].map(quoteForDisplay).join(" "),
    } satisfies CliInvocation;
  }

  const args = [
    "--print",
    "--permission-mode",
    "default",
    "--output-format",
    "text",
    input.promptText,
  ];

  return {
    cli: input.cli,
    executable: "claude",
    args,
    workdir,
    commandPreview: ["claude", ...args].map(quoteForDisplay).join(" "),
  } satisfies CliInvocation;
}

export async function runCliInvocation(invocation: CliInvocation) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number | null }>((resolve) => {
    const child = spawn(invocation.executable, invocation.args, {
      cwd: invocation.workdir,
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      stderr += error.message;
      resolve({ stdout, stderr, exitCode: null });
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    if (invocation.stdin) {
      child.stdin.write(invocation.stdin);
      child.stdin.end();
    }
  });
}
