import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public, read-only adapter used by the selected static storefront HTML.
export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("sub")?.trim().toLowerCase() || "";
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
      return NextResponse.json({ error: "Enter a valid shop link." }, { status: 400 });
    }
    const db = createAdminClient();
    const { data, error } = await db.rpc("public_storefront", { p_slug: slug });
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "This shop could not be found." }, { status: 404 });
    const shop = data as {
      business_name: string; slug: string; whatsapp_number: string; is_active: boolean;
      accepting_orders?: boolean; about?: string | null; address?: string | null; category?: string | null;
      banner_path?: string | null; logo_path?: string | null;
      products?: Array<{ id: string; name: string; description: string | null; category?: string | null; price: number; image_path: string | null; is_available: boolean; sort_order?: number }>;
    };
    const products = (shop.products || []).filter((p) => p.is_available).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category || "Other",
      price: Number(p.price),
      imageUrl: p.image_path ? db.storage.from("shop-media").getPublicUrl(p.image_path).data.publicUrl : null,
      isAvailable: p.is_available,
      sortOrder: p.sort_order ?? 0,
    }));
    return NextResponse.json({
      name: shop.business_name,
      businessName: shop.business_name,
      subdomain: shop.slug,
      slug: shop.slug,
      whatsapp: shop.whatsapp_number,
      active: shop.is_active,
      acceptingOrders: shop.accepting_orders !== false,
      about: shop.about || "",
      address: shop.address || "",
      category: shop.category || "",
      bannerPath: shop.banner_path || null,
      logoPath: shop.logo_path || null,
      bannerUrl: shop.banner_path ? db.storage.from("shop-media").getPublicUrl(shop.banner_path).data.publicUrl : null,
      logoUrl: shop.logo_path ? db.storage.from("shop-media").getPublicUrl(shop.logo_path).data.publicUrl : null,
      products,
    }, { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=30" } });
  } catch {
    return NextResponse.json({ error: "This shop is temporarily unavailable." }, { status: 503 });
  }
}
