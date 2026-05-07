import { NextResponse } from "next/server";
import { getOpenAIModel } from "@/lib/config";
import { insertGeneration } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { generatePlanFromIdea } from "@/lib/openai-generation";
import { generateRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
    const payload = generateRequestSchema.parse(rawBody);
    const { model, result } = await generatePlanFromIdea(payload.idea);
    const generationId = insertGeneration({
      idea: payload.idea,
      planItems: result.planItems,
      promptText: result.promptText,
      model,
      status: "completed",
    });

    return NextResponse.json({
      generationId,
      model,
      ...result,
    });
  } catch (error) {
    if (
      rawBody &&
      typeof rawBody === "object" &&
      "idea" in rawBody &&
      typeof rawBody.idea === "string"
    ) {
      insertGeneration({
        idea: rawBody.idea,
        planItems: [],
        promptText: "",
        model: getOpenAIModel(),
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return jsonError(error, 400);
  }
}
