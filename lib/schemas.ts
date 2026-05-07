import { z } from "zod";

export const cliSchema = z.enum(["codex", "claude"]);

export const generatedPlanSchema = z.object({
  planItems: z.array(z.string().trim().min(1)).min(4).max(14),
  promptText: z.string().trim().min(80),
  projectNameSuggestion: z.string().trim().min(1).max(80),
  techStackSuggestion: z.string().trim().min(1).max(120),
});

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;
export type CliKind = z.infer<typeof cliSchema>;

export const generateRequestSchema = z.object({
  idea: z.string().trim().min(10).max(2000),
});

export const prepareProjectRequestSchema = z.object({
  idea: z.string().trim().min(1).max(2000),
  planItems: z.array(z.string().trim().min(1)).min(1).max(20),
  promptText: z.string().trim().min(1),
  projectName: z.string().trim().min(1).max(80),
  cli: cliSchema.default("codex"),
  targetDir: z.string().trim().min(1),
  generationId: z.number().int().positive().optional(),
  confirmed: z.literal(true),
});

export const cliPreviewRequestSchema = z.object({
  cli: cliSchema,
  projectDir: z.string().trim().min(1),
  promptText: z.string().trim().min(1),
});

export const cliRunRequestSchema = cliPreviewRequestSchema.extend({
  confirmed: z.literal(true),
  projectId: z.number().int().positive().optional(),
  generationId: z.number().int().positive().optional(),
});
