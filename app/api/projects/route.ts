import { NextResponse } from "next/server";
import { listProjects } from "@/lib/db";
import { getProjectRoot } from "@/lib/config";
import { ensureInsideProjectRoot } from "@/lib/paths";
import { jsonError } from "@/lib/http";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projectRoot = ensureInsideProjectRoot(getProjectRoot());
    const directories = fs.existsSync(projectRoot)
      ? fs
          .readdirSync(projectRoot, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => ({
            name: entry.name,
            targetPath: path.win32.join(projectRoot, entry.name),
          }))
      : [];

    return NextResponse.json({
      projects: listProjects(),
      directories,
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
