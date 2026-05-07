import { describe, expect, it, vi } from "vitest";
import { buildCliInvocation } from "@/lib/cli";

vi.mock("@/lib/config", () => ({
  getProjectRoot: () => "D:\\Program Files (x86)\\ThinkingAP",
}));

describe("CLI preview", () => {
  it("builds the Codex command with stdin prompt and workspace-write sandbox", () => {
    const invocation = buildCliInvocation({
      cli: "codex",
      projectDir: "D:\\Program Files (x86)\\ThinkingAP\\demo",
      promptText: "Build it",
    });

    expect(invocation.executable).toBe("codex");
    expect(invocation.args).toContain("workspace-write");
    expect(invocation.stdin).toBe("Build it");
    expect(invocation.commandPreview).toContain("codex exec");
  });

  it("builds the Claude print command", () => {
    const invocation = buildCliInvocation({
      cli: "claude",
      projectDir: "D:\\Program Files (x86)\\ThinkingAP\\demo",
      promptText: "Build it",
    });

    expect(invocation.executable).toBe("claude");
    expect(invocation.args).toContain("--print");
    expect(invocation.args).toContain("--permission-mode");
    expect(invocation.commandPreview).toContain("claude");
  });

  it("rejects workdirs outside the root", () => {
    expect(() =>
      buildCliInvocation({
        cli: "codex",
        projectDir: "C:\\tmp\\demo",
        promptText: "Build it",
      })
    ).toThrow(/inside/);
  });
});
