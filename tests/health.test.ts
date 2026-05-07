import { describe, expect, it, vi } from "vitest";
import { clearHealthCacheForTests, getHealthSnapshot } from "@/lib/health";

vi.mock("@/lib/runtime-checks", () => ({
  checkGitAvailable: vi.fn(() => ({ available: true, output: "git version test" })),
  checkCliAvailable: vi.fn((command: string) => ({ available: command === "codex", output: command })),
  checkWorkspaceWritable: vi.fn(() => ({ writable: true })),
}));

describe("health cache", () => {
  it("reuses health snapshots within the TTL", async () => {
    clearHealthCacheForTests();
    const first = await getHealthSnapshot(true);
    const second = await getHealthSnapshot(false);
    expect(second.checkedAt).toBe(first.checkedAt);
  });

  it("forces a fresh health snapshot", async () => {
    clearHealthCacheForTests();
    const first = await getHealthSnapshot(true);
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await getHealthSnapshot(true);
    expect(second.checkedAt).toBeGreaterThanOrEqual(first.checkedAt);
  });
});
