import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, whatsapp_number')
    .eq('subdomain', subdomain)
    .single();

  if (!vendor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('is_available', true);

  return NextResponse.json({ vendor, products: products || [] });
}
