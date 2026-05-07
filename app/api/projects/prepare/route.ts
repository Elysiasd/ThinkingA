import { NextResponse } from "next/server";
import { upsertProject } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { prepareProjectFiles } from "@/lib/project";
import { prepareProjectRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = prepareProjectRequestSchema.parse(await request.json());
    const prepared = prepareProjectFiles(payload);
    const project = upsertProject({
      name: prepared.name,
      slug: prepared.slug,
      targetPath: prepared.targetPath,
      cli: payload.cli,
      gitStatus: prepared.gitStatus,
    });

    return NextResponse.json({
      project,
      files: [
        `${prepared.targetPath}\\.thinkingap\\plan.md`,
        `${prepared.targetPath}\\.thinkingap\\prompt.txt`,
        `${prepared.targetPath}\\README.md`,
      ],
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
