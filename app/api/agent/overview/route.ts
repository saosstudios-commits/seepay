import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await createServerSupabase();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const db = createAdminClient();
    const [{ data: profile }, { data: agent, error: agentError }] = await Promise.all([
      db.from("profiles").select("role,full_name,phone,contact_email").eq("id", user.id).maybeSingle(),
      db.from("agents").select("id,referral_code,momo_number,momo_network,created_at").eq("profile_id", user.id).maybeSingle(),
    ]);
    if (profile?.role !== "agent") return NextResponse.json({ error: "Agent access is required." }, { status: 403 });
    if (agentError) throw agentError;
    if (!agent) return NextResponse.json({ error: "Your agent profile could not be found." }, { status: 404 });

    const [{ data: vendors, error: vendorsError }, { data: commissions, error: commissionsError }, { data: payouts, error: payoutsError }] = await Promise.all([
      db.from("vendors").select("id,business_name,slug,is_active,created_at").eq("agent_id", agent.id).order("created_at", { ascending: false }),
      db.from("commissions").select("vendor_id,amount,created_at").eq("agent_id", agent.id).order("created_at", { ascending: false }),
      db.from("payouts").select("id,amount,momo_number,momo_network,status,momo_reference,requested_at,processed_at").eq("agent_id", agent.id).order("requested_at", { ascending: false }),
    ]);
    if (vendorsError || commissionsError || payoutsError) throw vendorsError || commissionsError || payoutsError;

    const vendorMap = new Map((vendors || []).map((v) => [v.id, v]));
    const commissionRows = (commissions || []).map((c) => ({
      vendorId: c.vendor_id,
      vendorName: vendorMap.get(c.vendor_id)?.business_name || "Shop",
      amount: Number(c.amount),
      createdAt: c.created_at,
    }));
    const earned = commissionRows.reduce((sum, c) => sum + c.amount, 0);
    const paid = (payouts || []).filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0);
    const committed = (payouts || []).filter((p) => p.status === "PENDING" || p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0);
    return NextResponse.json({
      profile: { fullName: profile.full_name, phone: profile.phone, contactEmail: profile.contact_email || "" },
      agent: { id: agent.id, referralCode: agent.referral_code, momoNumber: agent.momo_number, momoNetwork: agent.momo_network, createdAt: agent.created_at },
      referrals: (vendors || []).map((v) => {
        const commission = commissionRows.find((c) => c.vendorId === v.id);
        return { id: v.id, name: v.business_name, slug: v.slug, status: v.is_active ? "activated" : "pending", createdAt: v.created_at, commission: commission?.amount || 0 };
      }),
      commissions: commissionRows,
      payouts: (payouts || []).map((p) => ({ ...p, amount: Number(p.amount) })),
      metrics: { referralCount: (vendors || []).length, activatedCount: (vendors || []).filter((v) => v.is_active).length, waitingCount: (vendors || []).filter((v) => !v.is_active).length, earned, paid, available: Math.max(0, Math.round((earned - committed) * 100) / 100) },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Agent data is unavailable right now." }, { status: 503 });
  }
}
