import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempRoot = "";

vi.mock("@/lib/config", () => ({
  getProjectRoot: () => tempRoot,
}));

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

describe("prepareProjectFiles", () => {
  beforeEach(() => {
    tempRoot = path.join(os.tmpdir(), `thinkingap-${Date.now()}`).replace(/\//g, "\\");
    fs.mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("writes ThinkingAP files and README inside the target project", async () => {
    const { prepareProjectFiles } = await import("@/lib/project");
    const targetDir = `${tempRoot}\\demo`;
    const result = prepareProjectFiles({
      idea: "A local idea app",
      planItems: ["分析", "实现"],
      promptText: "Build a minimal app",
      projectName: "Demo",
      targetDir,
      cli: "codex",
    });

    expect(result.gitStatus).toBe("initialized");
    expect(fs.existsSync(`${targetDir}\\.thinkingap\\plan.md`)).toBe(true);
    expect(fs.existsSync(`${targetDir}\\.thinkingap\\prompt.txt`)).toBe(true);
    expect(fs.existsSync(`${targetDir}\\README.md`)).toBe(true);
  });
});
