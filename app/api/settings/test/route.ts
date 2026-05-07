import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getOpenAIBaseURL, getOpenAIKey } from "@/lib/config";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

const testSchema = z.object({
  openaiApiKey: z.string().trim().optional(),
  openaiBaseUrl: z.string().trim().url().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = testSchema.parse(await request.json().catch(() => ({})));
    const apiKey = payload.openaiApiKey || getOpenAIKey();
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "OpenAI API Key is not configured" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey, baseURL: payload.openaiBaseUrl || getOpenAIBaseURL() });
    await client.models.list();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, 400);
  }
}
