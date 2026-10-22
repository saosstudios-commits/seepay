import type { Metadata } from "next";
import Link from "next/link";
import OrdersManager from "@/components/OrdersManager";
import { createServerSupabase } from "@/lib/supabase/server";
export const metadata:Metadata={title:"Orders"};
export default async function OrdersPage(){const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();if(!user)return <div className="container py-12">Please log in.</div>;const {data:vendor}=await supabase.from("vendors").select("business_name,is_active").eq("owner_id",user.id).maybeSingle();return <main className="container py-8 sp-page sp-page--vendor-orders"><Link className="text-sm underline" href="/dashboard/vendor">← Your shop</Link><h1 className="display mt-4 text-4xl font-bold">Orders</h1><p className="muted mt-2">Track payments and prepare orders for {vendor?.business_name||"your shop"}.</p><div className="mt-6">{vendor?.is_active?<OrdersManager/>:<div className="ticket"><h2 className="display text-2xl font-bold">Pay GH₵ 150 to go live</h2><p className="mt-2">Your orders will appear here after activation.</p><Link className="btn mt-4" href="/dashboard/vendor">Go to overview</Link></div>}</div></main>}
