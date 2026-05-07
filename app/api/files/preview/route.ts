import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/http";
import { readTextFile } from "@/lib/fs-utils";

export const runtime = "nodejs";

const previewSchema = z.object({
  path: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = previewSchema.parse(await request.json());
    const content = readTextFile(payload.path);
    return NextResponse.json({ content });
  } catch (error) {
    return jsonError(error, 400);
  }
}
