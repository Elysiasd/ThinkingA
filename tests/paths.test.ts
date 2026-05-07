import { describe, expect, it } from "vitest";
import { ensureInsideProjectRoot, getDefaultProjectPath, sanitizeSlug } from "@/lib/paths";

const root = "D:\\Program Files (x86)\\ThinkingAP";

describe("path safety", () => {
  it("allows paths inside the configured project root", () => {
    expect(ensureInsideProjectRoot(`${root}\\demo`, root)).toBe(`${root}\\demo`);
  });

  it("rejects traversal outside the configured project root", () => {
    expect(() => ensureInsideProjectRoot(`${root}\\..\\Other`, root)).toThrow(/inside/);
  });

  it("rejects absolute paths outside the configured project root", () => {
    expect(() => ensureInsideProjectRoot("C:\\Users\\honor\\demo", root)).toThrow(/inside/);
  });

  it("sanitizes project names into stable folder slugs", () => {
    expect(sanitizeSlug("Odd Idea Notes!!!")).toBe("odd-idea-notes");
    expect(getDefaultProjectPath("Odd Idea Notes!!!", root)).toBe(`${root}\\odd-idea-notes`);
  });
});
