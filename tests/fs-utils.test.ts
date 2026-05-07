import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readTextFile, scanDirectoryTree } from "@/lib/fs-utils";

let root = "";

vi.mock("@/lib/config", () => ({
  getProjectRoot: () => root,
}));

describe("filesystem utils", () => {
  beforeEach(() => {
    root = path.join(os.tmpdir(), `thinkingap-tree-${Date.now()}`).replace(/\//g, "\\");
    fs.mkdirSync(root, { recursive: true });
    fs.mkdirSync(`${root}\\.git\\hooks`, { recursive: true });
    fs.writeFileSync(`${root}\\.git\\hooks\\pre-commit.sample`, "sample", "utf8");
    fs.mkdirSync(`${root}\\.next`, { recursive: true });
    fs.mkdirSync(`${root}\\node_modules`, { recursive: true });
    fs.writeFileSync(`${root}\\thinkingap.db`, "db", "utf8");
    fs.mkdirSync(`${root}\\alpha`, { recursive: true });
    fs.writeFileSync(`${root}\\alpha\\plan.md`, "# plan", "utf8");
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("scans directories inside the workspace root", () => {
    const tree = scanDirectoryTree(root, 3);
    expect(tree.map((node) => node.name)).toContain("alpha");
    expect(tree.map((node) => node.name)).not.toContain(".git");
    expect(tree.map((node) => node.name)).not.toContain("node_modules");
    expect(tree.map((node) => node.name)).not.toContain(".next");
  });

  it("reads text files only", () => {
    expect(readTextFile(`${root}\\alpha\\plan.md`, root)).toContain("# plan");
  });
});
