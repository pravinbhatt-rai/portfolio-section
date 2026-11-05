import { NextResponse } from "next/server";
import { canEditPortfolio } from "../../../../lib/admin-session";

const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: Request) {
  if (!(await canEditPortfolio())) return NextResponse.json({ error: "An editor role is required to upload logos." }, { status: 403 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 503 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !allowed.has(file.type)) return NextResponse.json({ error: "Choose a PNG, JPEG, or WebP logo." }, { status: 400 });
  if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Logo files must be 3 MB or smaller." }, { status: 400 });
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const objectPath = `career/${crypto.randomUUID()}.${extension}`;
  const upload = await fetch(`${url}/storage/v1/object/portfolio-logos/${objectPath}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": file.type, "x-upsert": "false" },
    body: await file.arrayBuffer(),
    cache: "no-store",
  });
  if (!upload.ok) return NextResponse.json({ error: "Logo upload failed. Confirm the portfolio-logos storage bucket exists." }, { status: 502 });
  return NextResponse.json({ url: `${url}/storage/v1/object/public/portfolio-logos/${objectPath}` });
}
