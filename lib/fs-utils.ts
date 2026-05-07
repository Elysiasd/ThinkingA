import fs from "node:fs";
import path from "node:path";
import { getProjectRoot } from "./config";
import { ensureInsideProjectRoot } from "./paths";

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".html",
  ".toml",
  ".env",
  ".gitignore",
]);

export type FileNode = {
  name: string;
  path: string;
  kind: "file" | "directory";
  children?: FileNode[];
};

export function getWorkspaceRoot() {
  return ensureInsideProjectRoot(getProjectRoot());
}

export function scanDirectoryTree(rootPath = getWorkspaceRoot(), maxDepth = 4) {
  const workspaceRoot = getWorkspaceRoot();
  const safeRoot = ensureInsideProjectRoot(rootPath, workspaceRoot);

  function walk(currentPath: string, depth: number): FileNode[] {
    if (depth > maxDepth) {
      return [];
    }

    const entries = fs
      .readdirSync(currentPath, { withFileTypes: true })
      .filter((entry) => !["node_modules", ".next", "dist", "coverage"].includes(entry.name))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    return entries.map((entry) => {
      const fullPath = ensureInsideProjectRoot(path.win32.join(currentPath, entry.name), safeRoot);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: fullPath,
          kind: "directory" as const,
          children: walk(fullPath, depth + 1),
        };
      }

      return {
        name: entry.name,
        path: fullPath,
        kind: "file" as const,
      };
    });
  }

  return walk(safeRoot, 0);
}

export function readTextFile(filePath: string, rootPath = getWorkspaceRoot()) {
  const safePath = ensureInsideProjectRoot(filePath, rootPath);
  const extension = path.extname(safePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(extension) && ![".env", ".gitignore"].includes(path.basename(safePath).toLowerCase())) {
    throw new Error("Only text files can be previewed in ThinkingAP");
  }

  return fs.readFileSync(safePath, "utf8");
}

export function pathExistsWithinRoot(candidatePath: string, rootPath = getWorkspaceRoot()) {
  const safePath = ensureInsideProjectRoot(candidatePath, rootPath);
  return fs.existsSync(safePath);
}
