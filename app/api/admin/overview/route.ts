import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function statusForVendor(v: { is_active: boolean; activation_reference: string | null }) {
  return v.is_active ? "active" : v.activation_reference ? "pending" : "registered";
}

export async function GET() {
  try {
    const auth = await createServerSupabase();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const db = createAdminClient();
    const { data: actor } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (actor?.role !== "admin") return NextResponse.json({ error: "Admin access is required." }, { status: 403 });

    const [vendorResult, agentResult, orderResult, payoutResult, commissionResult, auditResult] = await Promise.all([
      db.from("vendors").select("id,owner_id,business_name,slug,category,is_active,activation_reference,created_at,agent_id" ).order("created_at", { ascending: false }).limit(500),
      db.from("agents").select("id,profile_id,referral_code,momo_number,momo_network,created_at").order("created_at", { ascending: false }).limit(500),
      db.from("orders").select("id,reference,vendor_id,customer_name,customer_phone,fulfilment,delivery_address,total_amount,platform_fee,vendor_amount,payment_status,pay_network,fulfilment_status,created_at,paid_at").order("created_at", { ascending: false }).limit(500),
      db.from("payouts").select("id,agent_id,amount,momo_number,momo_network,status,momo_reference,requested_at,processed_at,rejection_reason").order("requested_at", { ascending: false }).limit(500),
      db.from("commissions").select("agent_id,vendor_id,amount,created_at").limit(1000),
      db.from("admin_audit").select("id,actor,action,target,details,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    for (const r of [vendorResult, agentResult, orderResult, payoutResult, commissionResult, auditResult]) if (r.error) throw r.error;

    const vendors = vendorResult.data || [];
    const agents = agentResult.data || [];
    const orders = orderResult.data || [];
    const payouts = payoutResult.data || [];
    const commissions = commissionResult.data || [];
    const audit = auditResult.data || [];
    const profileIds = [...new Set([...vendors.map((v) => v.owner_id), ...agents.map((a) => a.profile_id)])];
    const { data: profiles, error: profilesError } = profileIds.length
      ? await db.from("profiles").select("id,full_name,phone,contact_email,role").in("id", profileIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));
    const agentMap = new Map(agents.map((a) => [a.id, a]));
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentOrders = orders.filter((o) => new Date(o.created_at).getTime() >= since);
    const paidRecent = recentOrders.filter((o) => o.payment_status === "SUCCESS");
    const vendorsFormatted = vendors.map((v) => {
      const owner = profileMap.get(v.owner_id);
      const vendorOrders = orders.filter((o) => o.vendor_id === v.id);
      const successful = vendorOrders.filter((o) => o.payment_status === "SUCCESS");
      return { id: v.id, name: v.business_name, addr: v.slug, owner: owner?.full_name || "—", phone: owner?.phone || "", cat: v.category || "—", joined: v.created_at, status: statusForVendor(v), st: statusForVendor(v), active: v.is_active, orders: vendorOrders.length, gmv: successful.reduce((s, o) => s + Number(o.total_amount), 0) };
    });
    const agentsFormatted = agents.map((a) => {
      const p = profileMap.get(a.profile_id);
      const refs = vendors.filter((v) => v.agent_id === a.id);
      const earned = commissions.filter((c) => c.agent_id === a.id).reduce((s, c) => s + Number(c.amount), 0);
      const paid = payouts.filter((x) => x.agent_id === a.id && x.status === "PAID").reduce((s, x) => s + Number(x.amount), 0);
      return { id: a.id, name: p?.full_name || "—", code: a.referral_code, phone: p?.phone || a.momo_number, refs: refs.length, act: refs.filter((v) => v.is_active).length, earned, paid, st: "active" };
    });
    const ordersFormatted = orders.map((o) => {
      const vendor = vendorMap.get(o.vendor_id);
      const status = o.payment_status === "PENDING" ? "pending" : o.payment_status !== "SUCCESS" ? "cancelled" : ({ NEW: "paid", PREPARING: "preparing", READY: "ready", COMPLETED: "fulfilled", CANCELLED: "cancelled" } as Record<string, string>)[o.fulfilment_status] || "paid";
      return { id: o.reference, dbId: o.id, reference: o.reference, vendorId: o.vendor_id, vendorName: vendor?.business_name || "—", cust: o.customer_name, phone: o.customer_phone, area: o.delivery_address || o.fulfilment, net: o.pay_network || "—", total: Number(o.total_amount), vendorAmount: o.vendor_amount == null ? null : Number(o.vendor_amount), platformFee: Number(o.platform_fee), paymentStatus: o.payment_status, fulfilmentStatus: o.fulfilment_status, st: status, date: o.created_at, createdAt: o.created_at, items: [] };
    });
    const payoutsFormatted = payouts.map((p) => {
      const agent = agentMap.get(p.agent_id);
      const profile = agent ? profileMap.get(agent.profile_id) : null;
      const st = p.status === "PENDING" ? "processing" : p.status === "PAID" ? "paid" : "rejected";
      return { id: p.id, reference: p.momo_reference || p.id.slice(0, 8).toUpperCase(), amt: Number(p.amount), amount: Number(p.amount), date: p.requested_at, st, status: p.status, net: `${p.momo_network} ···· ${p.momo_number.slice(-4)}`, phone: p.momo_number, momoNetwork: p.momo_network, agentId: p.agent_id, agentName: profile?.full_name || "—" };
    });
    const activity = audit.map((a) => ({ time: a.created_at, text: `${a.action.replaceAll("_", " ")} · ${a.target}`, tag: a.action.toLowerCase().includes("payout") ? "payout" : a.action.toLowerCase().includes("vendor") ? "vendor" : "payment" }));
    return NextResponse.json({
      vendors: vendorsFormatted,
      agents: agentsFormatted,
      orders: ordersFormatted,
      payouts: payoutsFormatted,
      activity,
      monthlyGmv: Array.from({ length: 12 }, (_, index) => {
        const now = new Date();
        const month = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
        const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
        const value = orders.filter((o) => o.payment_status === "SUCCESS" && new Date(o.created_at) >= month && new Date(o.created_at) < next).reduce((sum, o) => sum + Number(o.total_amount), 0);
        return { month: month.toLocaleDateString("en-GH", { month: "short", year: "2-digit" }), value };
      }),
      metrics: {
        gmv30d: paidRecent.reduce((s, o) => s + Number(o.total_amount), 0),
        activeVendors: vendors.filter((v) => v.is_active).length,
        orders30d: recentOrders.length,
        fees30d: paidRecent.reduce((s, o) => s + Number(o.platform_fee), 0),
        pendingPayoutCount: payouts.filter((p) => p.status === "PENDING").length,
        pendingPayoutTotal: payouts.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.amount), 0),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Administrator data is unavailable right now." }, { status: 503 });
  }
}
