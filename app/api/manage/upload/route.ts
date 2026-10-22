import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
const schema = z.object({ contentType: z.literal("image/webp"), data: z.string().min(40).max(5_000_000) });
export async function POST(request: Request) {
  try {
    const auth = await createServerSupabase();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const db = createAdminClient();
    const { data: vendor } = await db.from("vendors").select("id,is_active").eq("owner_id", user.id).maybeSingle();
    if (!vendor) return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    if (!vendor.is_active) return NextResponse.json({ error: "Pay the setup fee before managing products." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Choose a supported product photo." }, { status: 400 });
    const bytes = Buffer.from(parsed.data.data, "base64");
    if (bytes.length < 20 || bytes.length > 3_000_000 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
      return NextResponse.json({ error: "The photo must be a valid WebP image under 3 MB." }, { status: 400 });
    }
    const path = `${vendor.id}/products/${crypto.randomUUID().replace(/-/g, "")}.webp`;
    const { error } = await db.storage.from("shop-media").upload(path, bytes, { contentType: "image/webp", cacheControl: "3600", upsert: false });
    if (error) throw error;
    const url = db.storage.from("shop-media").getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ path, url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Photo upload failed. Try a smaller image." }, { status: 503 });
  }
}
