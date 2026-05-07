import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db";
import { scanDirectoryTree } from "@/lib/fs-utils";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const project = getProjectById(Number(id));
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      tree: scanDirectoryTree(project.target_path, 6),
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
