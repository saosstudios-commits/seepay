import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ujglzenehqvuazkutjqr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ2x6ZW5laHF2dWF6a3V0anFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjQyODY0MywiZXhwIjoyMTA4MDA0NjQzfQ.7obwkzmsOmi8GZlVczL1RAesEyW8tvrO_s1TfIABW9Y'
);

export default async function StorePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, whatsapp_number, is_active')
    .eq('subdomain', subdomain)
    .single();

  if (!vendor) {
    return (
      <div className="min-h-screen bg-[#F2F7F3] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#0B2E21]">Shop not found</h1>
          <a href="/" className="text-[#0B2E21] underline mt-4 inline-block">Go home</a>
        </div>
      </div>
    );
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('is_available', true);

  return (
    <div className="min-h-screen bg-[#F2F7F3]">
      <div className="bg-[#0B2E21] text-white py-6">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{vendor.business_name}</h1>
          <p className="text-[#CFE9DB] mt-1">WhatsApp: {vendor.whatsapp_number}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-[#0B2E21] mb-6">Menu</h2>

        <div className="space-y-4">
          {products && products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="bg-white p-5 rounded-2xl shadow border border-[#d5e2da]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-[#0B2E21]">{product.name}</h3>
                    {product.description && (
                      <p className="text-[#4b5f55] text-sm mt-1">{product.description}</p>
                    )}
                  </div>
                  <p className="font-bold text-lg text-[#0B2E21]">GH₵ {product.price}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-2xl text-center border border-[#d5e2da]">
              <p className="text-[#4b5f55]">No products yet. Check back soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}