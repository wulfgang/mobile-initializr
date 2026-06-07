import { NextResponse } from "next/server";
import { companyCatalog, ValidationError } from "@initializr/catalog";
import { generateZip } from "@initializr/generator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { buffer, baseName } = await generateZip(companyCatalog, body);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${baseName}.zip"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
