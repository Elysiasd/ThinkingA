import { NextResponse } from "next/server";
import { buildCliInvocation, runCliInvocation } from "@/lib/cli";
import { finishRun, insertRun } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { cliRunRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = cliRunRequestSchema.parse(await request.json());
    const invocation = buildCliInvocation(payload);
    const runId = insertRun({
      projectId: payload.projectId,
      generationId: payload.generationId,
      cli: payload.cli,
      commandPreview: invocation.commandPreview,
      workdir: invocation.workdir,
    });
    const result = await runCliInvocation(invocation);
    finishRun({
      id: runId,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    });

    return NextResponse.json({
      runId,
      commandPreview: invocation.commandPreview,
      workdir: invocation.workdir,
      ...result,
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
