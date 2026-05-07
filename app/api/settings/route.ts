import { NextResponse } from "next/server";
import { checkCliAvailable, checkGitAvailable, checkWorkspaceWritable } from "@/lib/runtime-checks";
import { jsonError } from "@/lib/http";
import { getSettingsSnapshot, updateSettings } from "@/lib/settings";
import { z } from "zod";

export const runtime = "nodejs";

const settingsSchema = z.object({
  openaiApiKey: z.string().trim().optional(),
  openaiModel: z.string().trim().optional(),
  openaiBaseUrl: z.string().trim().url().optional(),
  projectRoot: z.string().trim().optional(),
});

export async function GET() {
  const snapshot = getSettingsSnapshot();
  return NextResponse.json({
    settings: snapshot,
    status: {
      git: checkGitAvailable(),
      codex: checkCliAvailable("codex"),
      claude: checkCliAvailable("claude"),
      workspace: checkWorkspaceWritable(),
    },
  });
}

export async function PUT(request: Request) {
  try {
    const payload = settingsSchema.parse(await request.json());
    const settings = updateSettings(payload);
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error, 400);
  }
}
