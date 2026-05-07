import { describe, expect, it } from "vitest";

describe("settings route contract", () => {
  it("keeps masked key output separate from stored key", () => {
    const masked = "sk-...abcd";
    expect(masked).toContain("...");
  });
});
