import { NextResponse } from "next/server";
import { getProjectById, listRunsForProject } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getProjectRoot } from "@/lib/config";
import { ensureInsideProjectRoot } from "@/lib/paths";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const project = getProjectById(Number(id));
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const root = ensureInsideProjectRoot(project.target_path || getProjectRoot());
    const exists = fs.existsSync(root);

    const tree = exists
      ? fs.readdirSync(root, { withFileTypes: true }).map((entry) => ({
          name: entry.name,
          path: path.win32.join(root, entry.name),
          kind: entry.isDirectory() ? "directory" : "file",
        }))
      : [];

    return NextResponse.json({
      project,
      runs: listRunsForProject(project.id),
      tree,
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
