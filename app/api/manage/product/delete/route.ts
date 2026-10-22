import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
const schema = z.object({ id: z.string().uuid() });
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
    if (!parsed.success) return NextResponse.json({ error: "Product not found." }, { status: 400 });
    const { data: product } = await db.from("products").select("id,image_path").eq("id", parsed.data.id).eq("vendor_id", vendor.id).maybeSingle();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const { error } = await db.from("products").delete().eq("id", product.id).eq("vendor_id", vendor.id);
    if (error) throw error;
    if (product.image_path?.startsWith(`${vendor.id}/products/`)) await db.storage.from("shop-media").remove([product.image_path]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Product could not be deleted." }, { status: 503 });
  }
}
