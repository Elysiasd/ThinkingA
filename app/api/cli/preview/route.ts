import { NextResponse } from "next/server";
import { buildCliInvocation } from "@/lib/cli";
import { jsonError } from "@/lib/http";
import { cliPreviewRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = cliPreviewRequestSchema.parse(await request.json());
    const invocation = buildCliInvocation(payload);
    return NextResponse.json({
      cli: invocation.cli,
      commandPreview: invocation.commandPreview,
      workdir: invocation.workdir,
      usesStdin: Boolean(invocation.stdin),
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
