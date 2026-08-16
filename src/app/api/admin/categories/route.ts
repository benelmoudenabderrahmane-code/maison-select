import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PATH = join(process.cwd(), "src/data/categories.json");

function read() {
  try { return JSON.parse(readFileSync(PATH, "utf-8")); } catch { return []; }
}

export async function GET() {
  return NextResponse.json(read());
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: "Array attendu" }, { status: 400 });
    writeFileSync(PATH, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
