import { describe, expect, it } from "vitest";
import { parseGeneratedPlan } from "@/lib/openai-generation";

describe("parseGeneratedPlan", () => {
  it("parses a valid structured output payload", () => {
    const parsed = parseGeneratedPlan(
      JSON.stringify({
        planItems: ["需求分析", "MVP 定义", "架构设计", "测试验收"],
        promptText:
          "请构建一个最小可运行项目，包含 README、基础代码、运行说明、清晰目录结构，并确保可以在本地启动。实现时优先保持代码简单、模块边界清楚，并写出后续扩展建议。",
        projectNameSuggestion: "Idea Forge",
        techStackSuggestion: "Next.js + SQLite",
      })
    );

    expect(parsed.projectNameSuggestion).toBe("Idea Forge");
    expect(parsed.planItems).toHaveLength(4);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseGeneratedPlan("{nope")).toThrow(/valid JSON/);
  });

  it("rejects missing required fields", () => {
    expect(() => parseGeneratedPlan(JSON.stringify({ planItems: [] }))).toThrow();
  });
});
