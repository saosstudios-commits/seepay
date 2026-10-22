import Link from "next/link";
import DashboardNav from "@/components/DashboardNav";
import { createServerSupabase } from "@/lib/supabase/server";
import RealtimeOrders from "@/components/RealtimeOrders";
import { Brand } from "@/components/ui/Brand";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let vendorId: string | undefined;

  if (user) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    vendorId = vendor?.id;
  }

  return (
    <>
      <header className="sp-app-header">
        <div className="container flex min-h-[72px] items-center justify-between gap-4 py-3">
          <Brand light />
          <span className="hidden text-sm font-semibold text-[#CFE9DB] sm:inline">Shop dashboard</span>
          <Link href="/dashboard/vendor" className="btn gold min-h-10 px-3 py-2 text-sm">
            My shop
          </Link>
        </div>
      </header>
      {vendorId && (
        <div className="container">
          <RealtimeOrders vendorId={vendorId} />
          <DashboardNav variant="vendor" />
        </div>
      )}
      {children}
    </>
  );
}
