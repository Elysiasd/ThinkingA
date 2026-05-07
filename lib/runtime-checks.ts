import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { getProjectRoot } from "./config";
import { ensureInsideProjectRoot } from "./paths";

export function checkCommandAvailable(command: string) {
  const result = spawnSync(command, ["--version"], {
    shell: true,
    windowsHide: true,
    encoding: "utf8",
  });

  return {
    available: result.status === 0,
    output: [result.stdout, result.stderr].filter(Boolean).join("\n").trim(),
  };
}

export function checkGitAvailable() {
  return checkCommandAvailable("git");
}

export function checkCliAvailable(command: "codex" | "claude") {
  return checkCommandAvailable(command);
}

export function checkWorkspaceWritable() {
  const root = ensureInsideProjectRoot(getProjectRoot());
  try {
    fs.mkdirSync(root, { recursive: true });
    const probe = `${root}\\.__thinkingap_write_probe`;
    fs.writeFileSync(probe, "ok", "utf8");
    fs.unlinkSync(probe);
    return { writable: true };
  } catch (error) {
    return { writable: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
