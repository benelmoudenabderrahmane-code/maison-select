import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CUSTOM = join(process.cwd(), "src/data/customProducts.json");

function readCustom() {
  try { return JSON.parse(readFileSync(CUSTOM, "utf-8")); } catch { return {}; }
}

export async function GET() {
  return NextResponse.json(readCustom());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.asin || typeof body.asin !== "string") {
      return NextResponse.json({ error: "asin requis" }, { status: 400 });
    }
    const current = readCustom();
    current[body.asin] = { ...current[body.asin], ...body };
    writeFileSync(CUSTOM, JSON.stringify(current, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { asin } = await req.json();
    const current = readCustom();
    delete current[asin];
    writeFileSync(CUSTOM, JSON.stringify(current, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
