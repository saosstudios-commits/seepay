import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200).optional().nullable(), category: z.string().trim().max(60).optional().nullable(), price: z.number().min(0.5).max(50000),
  imagePath: z.string().max(600).optional().nullable(), isAvailable: z.boolean().optional(),
});
export async function POST(request: Request) {
  try {
    const auth = await createServerSupabase();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const db = createAdminClient();
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "vendor") return NextResponse.json({ error: "Vendor access is required." }, { status: 403 });
    const { data: vendor } = await db.from("vendors").select("id,is_active").eq("owner_id", user.id).maybeSingle();
    if (!vendor) return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    if (!vendor.is_active) return NextResponse.json({ error: "Pay the setup fee before managing products." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the product details." }, { status: 400 });
    const v = parsed.data;
    if (v.imagePath && (!v.imagePath.startsWith(`${vendor.id}/products/`) || !/^[a-z0-9-]+\.webp$/.test(v.imagePath.split("/").at(-1) || ""))) {
      return NextResponse.json({ error: "Choose a product photo uploaded to your shop." }, { status: 400 });
    }
    let row;
    if (v.id) {
      const { data: current } = await db.from("products").select("id").eq("id", v.id).eq("vendor_id", vendor.id).maybeSingle();
      if (!current) return NextResponse.json({ error: "Product not found." }, { status: 404 });
      const { data, error } = await db.from("products").update({
        name: v.name, description: v.description || null, category: v.category || null, price: Math.round(v.price * 100) / 100,
        image_path: v.imagePath || null, is_available: v.isAvailable ?? true, updated_at: new Date().toISOString(),
      }).eq("id", v.id).eq("vendor_id", vendor.id).select("id,name,description,price,image_path,is_available,category,sort_order").single();
      if (error) throw error; row = data;
    } else {
      const { data: last } = await db.from("products").select("sort_order").eq("vendor_id", vendor.id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await db.from("products").insert({
        vendor_id: vendor.id, name: v.name, description: v.description || null, category: v.category || null, price: Math.round(v.price * 100) / 100,
        image_path: v.imagePath || null, is_available: v.isAvailable ?? true, sort_order: (last?.sort_order || 0) + 1,
      }).select("id,name,description,price,image_path,is_available,category,sort_order").single();
      if (error) throw error; row = data;
    }
    return NextResponse.json({
      id: row.id, name: row.name, description: row.description, price: Number(row.price), imagePath: row.image_path,
      imageUrl: row.image_path ? db.storage.from("shop-media").getPublicUrl(row.image_path).data.publicUrl : null,
      isAvailable: row.is_available, category: row.category, sortOrder: row.sort_order,
    }, { status: v.id ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Product could not be saved. Check the details and try again." }, { status: 400 });
  }
}
