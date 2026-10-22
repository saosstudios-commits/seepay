import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeGhanaPhone } from "@/lib/phone";
import { networkSchema } from "@/lib/validation";

const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  contactEmail: z.union([z.string().email().max(254), z.literal("")]),
  momoNumber: z.string().min(9).max(20),
  momoNetwork: networkSchema,
});

export async function PATCH(request: Request) {
  try {
    const auth = await createServerSupabase();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check your profile and Mobile Money details." }, { status: 400 });
    const phone = normalizeGhanaPhone(parsed.data.momoNumber);
    if (!phone) return NextResponse.json({ error: "Enter a valid Ghana Mobile Money number." }, { status: 400 });

    const db = createAdminClient();
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "agent") return NextResponse.json({ error: "Agent access is required." }, { status: 403 });
    const [{ error: profileError }, { error: agentError }] = await Promise.all([
      db.from("profiles").update({ full_name: parsed.data.fullName, contact_email: parsed.data.contactEmail || null }).eq("id", user.id),
      db.from("agents").update({ momo_number: phone, momo_network: parsed.data.momoNetwork }).eq("profile_id", user.id),
    ]);
    if (profileError || agentError) throw profileError || agentError;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Your agent profile could not be saved." }, { status: 503 });
  }
}
