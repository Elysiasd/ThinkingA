import OpenAI from "openai";
import { getOpenAIBaseURL, getOpenAIKey, getOpenAIModel, isOpenAIConfigured } from "./config";
import { generatedPlanSchema, type GeneratedPlan } from "./schemas";

export const generationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    planItems: {
      type: "array",
      minItems: 4,
      maxItems: 14,
      items: { type: "string" },
    },
    promptText: {
      type: "string",
      description: "A complete implementation prompt for a local AI coding CLI.",
    },
    projectNameSuggestion: {
      type: "string",
      description: "Short product/project name, suitable for a folder label.",
    },
    techStackSuggestion: {
      type: "string",
      description: "A concise recommended stack for the generated prototype.",
    },
  },
  required: ["planItems", "promptText", "projectNameSuggestion", "techStackSuggestion"],
} as const;

export function parseGeneratedPlan(rawText: string): GeneratedPlan {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("OpenAI response was not valid JSON");
  }

  return generatedPlanSchema.parse(parsed);
}

export async function generatePlanFromIdea(idea: string) {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = getOpenAIModel();
  const client = new OpenAI({ apiKey: getOpenAIKey(), baseURL: getOpenAIBaseURL() });

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are ThinkingAP, a senior product-minded software architect. Convert unusual user ideas into practical MVP development plans and a ready-to-run coding-agent prompt. Respond only in the requested JSON schema. Use Chinese for user-facing plan items and prompt text unless the user explicitly requests another language.",
      },
      {
        role: "user",
        content: `Idea:\n${idea}\n\nCreate a realistic local-first MVP plan and a prompt that asks a coding CLI to produce a minimal runnable prototype with README and Git-friendly files.`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "thinkingap_generation",
        strict: true,
        schema: generationJsonSchema,
      },
    },
  } as OpenAI.Responses.ResponseCreateParamsNonStreaming);

  const outputText = response.output_text;
  if (!outputText) {
    throw new Error("OpenAI response did not include output text");
  }

  return {
    model,
    result: parseGeneratedPlan(outputText),
  };
}
