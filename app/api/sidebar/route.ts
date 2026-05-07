import { NextResponse } from "next/server";
import { getSidebarSnapshot } from "@/lib/sidebar";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getSidebarSnapshot());
}
