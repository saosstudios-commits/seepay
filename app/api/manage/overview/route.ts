import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Session-authenticated adapter for the selected vendor management HTML.
export async function GET() {
  try {
    const auth = await createServerSupabase();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const db = createAdminClient();
    const [{ data: profile }, { data: vendor, error: vendorError }] = await Promise.all([
      db.from("profiles").select("role,full_name,contact_email,phone").eq("id", user.id).maybeSingle(),
      db.from("vendors").select("id,business_name,slug,is_active,accepting_orders,whatsapp_number,about,address,category,momo_number,momo_network,banner_path,logo_path").eq("owner_id", user.id).maybeSingle(),
    ]);
    if (profile?.role !== "vendor") return NextResponse.json({ error: "Vendor access is required." }, { status: 403 });
    if (vendorError) throw vendorError;
    if (!vendor) return NextResponse.json({ error: "Your shop profile could not be found." }, { status: 404 });
    if (!vendor.is_active) return NextResponse.json({ error: "Your shop setup payment has not cleared yet." }, { status: 403 });
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: products, error: productsError }, { data: orders, error: ordersError }] = await Promise.all([
      db.from("products").select("id,name,description,price,image_path,is_available,category,sort_order").eq("vendor_id", vendor.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      db.from("orders").select("id,reference,customer_name,customer_phone,fulfilment,delivery_address,total_amount,platform_fee,vendor_amount,payment_status,pay_network,fulfilment_status,paid_at,created_at,order_items(product_id,name_snapshot,unit_price,quantity,line_total)").eq("vendor_id", vendor.id).order("created_at", { ascending: false }).limit(100),
    ]);
    if (productsError) throw productsError;
    if (ordersError) throw ordersError;
    const productRows = (products || []).map((p) => ({
      id: p.id, name: p.name, description: p.description, price: Number(p.price),
      imagePath: p.image_path,
      imageUrl: p.image_path ? db.storage.from("shop-media").getPublicUrl(p.image_path).data.publicUrl : null,
      isAvailable: p.is_available, category: p.category, sortOrder: p.sort_order,
    }));
    const orderRows = (orders || []).map((o) => ({
      id: o.id, reference: o.reference, customerName: o.customer_name, customerPhone: o.customer_phone,
      total: Number(o.total_amount), status: o.payment_status, paymentStatus: o.payment_status,
      fulfilment: o.fulfilment, deliveryAddress: o.delivery_address, platformFee: Number(o.platform_fee),
      vendorAmount: o.vendor_amount == null ? null : Number(o.vendor_amount), payNetwork: o.pay_network,
      fulfilmentStatus: o.fulfilment_status, paidAt: o.paid_at, createdAt: o.created_at,
      items: (o.order_items || []).map((i) => ({ productId: i.product_id, name: i.name_snapshot, qty: Number(i.quantity), price: Number(i.unit_price), lineTotal: Number(i.line_total) })),
    }));
    const paidThisWeek = orderRows.filter((o) => o.status === "SUCCESS" && o.createdAt >= since).reduce((sum, o) => sum + o.total, 0);
    return NextResponse.json({
      name: vendor.business_name, fullName: profile.full_name, contactEmail: profile.contact_email || "", phone: profile.phone || "", subdomain: vendor.slug,
      whatsapp: vendor.whatsapp_number, acceptingOrders: vendor.accepting_orders, about: vendor.about || "", address: vendor.address || "", category: vendor.category || "",
      momoNumber: vendor.momo_number || "", momoNetwork: vendor.momo_network || "MTN", bannerPath: vendor.banner_path || null, logoPath: vendor.logo_path || null,
      bannerUrl: vendor.banner_path ? db.storage.from("shop-media").getPublicUrl(vendor.banner_path).data.publicUrl : null,
      logoUrl: vendor.logo_path ? db.storage.from("shop-media").getPublicUrl(vendor.logo_path).data.publicUrl : null,
      paidThisWeek, pendingCount: orderRows.filter((o) => o.status === "PENDING").length,
      products: productRows, orders: orderRows,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Your shop data could not be loaded." }, { status: 503 });
  }
}
