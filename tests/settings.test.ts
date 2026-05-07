import { describe, expect, it } from "vitest";
import { maskSecret } from "@/lib/config";

describe("settings helpers", () => {
  it("masks secrets for display", () => {
    expect(maskSecret("sk-proj-abcdef1234567890")).toBe("sk-...7890");
  });
});
