import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type VendorSummary = {
  business_name: string;
  slug: string;
  whatsapp_number: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference } = await params;
    if (!/^(ORD_|ACT_)[A-Za-z0-9_-]{8,100}$/.test(reference)) {
      return NextResponse.json({ error: "Order reference is not valid." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data: order, error } = await db
      .from("orders")
      .select("reference,payment_status,total_amount,created_at,paid_at,vendor:vendors(business_name,slug,whatsapp_number),order_items(name_snapshot,unit_price,quantity,line_total)")
      .eq("reference", reference)
      .maybeSingle();

    if (error) throw error;

    if (!order) {
      const { data: activation } = await db
        .from("vendors")
        .select("is_active,slug,business_name")
        .eq("activation_reference", reference)
        .maybeSingle();

      if (activation) {
        return NextResponse.json({
          status: activation.is_active ? "SUCCESS" : "PENDING",
          shopName: activation.business_name,
          slug: activation.slug,
        });
      }
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Depending on relationship inference, the nested PostgREST relation may be an
    // object or a one-element array. Normalize both shapes before responding.
    const rawVendor = order.vendor as unknown;
    const vendor = (Array.isArray(rawVendor) ? rawVendor[0] : rawVendor) as VendorSummary | null;
    const hasExpired =
      order.payment_status === "PENDING" &&
      Date.now() - new Date(order.created_at).getTime() > 30 * 60 * 1000;

    if (hasExpired) {
      await db
        .from("orders")
        .update({ payment_status: "ABANDONED" })
        .eq("reference", reference)
        .eq("payment_status", "PENDING");

      return NextResponse.json({
        status: "ABANDONED",
        total: order.total_amount,
        createdAt: order.created_at,
        shopName: vendor?.business_name || "Shop",
        items: order.order_items,
      });
    }

    return NextResponse.json({
      status: order.payment_status,
      total: order.total_amount,
      shopName: vendor?.business_name || "Shop",
      slug: vendor?.slug,
      whatsappNumber: vendor?.whatsapp_number,
      items: order.order_items,
      paidAt: order.paid_at,
      createdAt: order.created_at,
    });
  } catch {
    return NextResponse.json({ error: "Order status is unavailable." }, { status: 503 });
  }
}
