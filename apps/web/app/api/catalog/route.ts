import { NextResponse } from "next/server";
import { companyCatalog } from "@initializr/catalog";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(companyCatalog);
}
