import path from "node:path";
import { getProjectRoot } from "./config";

const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function toWindowsPath(value: string) {
  return value.replace(/\//g, "\\").trim();
}

export function sanitizeSlug(input: string) {
  const slug = input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 48);

  if (!slug || RESERVED_WINDOWS_NAMES.test(slug)) {
    return "thinkingap-project";
  }

  return slug;
}

export function joinProjectRoot(slugOrPath: string, root = getProjectRoot()) {
  const cleaned = toWindowsPath(slugOrPath);
  if (path.win32.isAbsolute(cleaned)) {
    return ensureInsideProjectRoot(cleaned, root);
  }

  return ensureInsideProjectRoot(path.win32.join(root, cleaned), root);
}

export function ensureInsideProjectRoot(candidatePath: string, root = getProjectRoot()) {
  const normalizedRoot = path.win32.resolve(toWindowsPath(root));
  const normalizedCandidate = path.win32.resolve(toWindowsPath(candidatePath));
  const relative = path.win32.relative(normalizedRoot, normalizedCandidate);

  if (
    relative === "" ||
    (!relative.startsWith("..") && !path.win32.isAbsolute(relative))
  ) {
    return normalizedCandidate;
  }

  throw new Error(`Path must stay inside ${normalizedRoot}`);
}

export function getDefaultProjectPath(projectName: string, root = getProjectRoot()) {
  return path.win32.join(path.win32.resolve(toWindowsPath(root)), sanitizeSlug(projectName));
}

export function assertNoTraversal(value: string) {
  const parts = toWindowsPath(value).split("\\");
  if (parts.includes("..")) {
    throw new Error("Path traversal is not allowed");
  }
}
