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
  defaultExpanded?: boolean;
  children?: FileNode[];
};

const IGNORED_NAMES = new Set([
  ".git",
  ".next",
  ".turbo",
  ".cache",
  "node_modules",
  "dist",
  "coverage",
  "logs",
  "__pycache__",
]);

const IGNORED_EXTENSIONS = new Set([".db", ".db-shm", ".db-wal", ".log", ".tmp", ".cache"]);
const DEFAULT_EXPANDED_DIRECTORIES = new Set([".thinkingap", "src", "app", "core", "utils", "tests"]);
const PRIORITY_NAMES = [".thinkingap", "README.md", "package.json", "src", "app", "tests", "plan.md", "prompt.txt"];

function shouldIgnoreEntry(entry: fs.Dirent) {
  if (IGNORED_NAMES.has(entry.name)) {
    return true;
  }

  const extension = path.extname(entry.name).toLowerCase();
  return IGNORED_EXTENSIONS.has(extension);
}

function getPriority(name: string) {
  const index = PRIORITY_NAMES.findIndex((priority) => priority.toLowerCase() === name.toLowerCase());
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

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
      .filter((entry) => !shouldIgnoreEntry(entry))
      .sort((a, b) => {
        const priorityDiff = getPriority(a.name) - getPriority(b.name);
        if (priorityDiff !== 0) return priorityDiff;
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
          defaultExpanded: DEFAULT_EXPANDED_DIRECTORIES.has(entry.name),
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
