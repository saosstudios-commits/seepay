import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { businessName, subdomain, whatsappNumber, ownerMomoNumber, ownerMomoNetwork, referralCode } = await req.json();

    let agentId = null;

    if (referralCode) {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (agent) {
        agentId = agent.id;
      }
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        business_name: businessName,
        subdomain: subdomain.toLowerCase(),
        whatsapp_number: whatsappNumber,
        owner_momo_number: ownerMomoNumber,
        owner_momo_network: ownerMomoNetwork,
        agent_id: agentId,
        is_active: false,
        activation_fee_paid: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, vendorId: vendor.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
