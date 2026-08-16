import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const asin = formData.get("asin") as string | null;

    if (!file || !asin) {
      return NextResponse.json({ error: "file et asin requis" }, { status: 400 });
    }
    if (!/^[A-Z0-9]{10}$/i.test(asin)) {
      return NextResponse.json({ error: "ASIN invalide" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Fichier image requis" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image trop lourde (max 5 Mo)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "products");
    mkdirSync(uploadDir, { recursive: true });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `${asin}.${ext}`;
    writeFileSync(join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/products/${filename}` });
  } catch {
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
