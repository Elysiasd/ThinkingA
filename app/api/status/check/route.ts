import { NextResponse } from "next/server";
import { getHealthSnapshot } from "@/lib/health";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const status = await getHealthSnapshot(force);
  return NextResponse.json({ status });
}
