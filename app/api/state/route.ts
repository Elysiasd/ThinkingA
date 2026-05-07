import { NextResponse } from "next/server";
import { getDashboardState } from "@/lib/db";
import { getSidebarSnapshot } from "@/lib/sidebar";
import { getHealthSnapshot } from "@/lib/health";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ...getDashboardState(),
    sidebar: getSidebarSnapshot(),
    status: await getHealthSnapshot(),
  });
}
