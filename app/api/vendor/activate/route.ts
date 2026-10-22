import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackRequest } from "@/lib/paystack";
import { SETUP_FEE_GHS,toPesewas } from "@/lib/money";
type Resp={status:boolean;message:string;data:{authorization_url:string}};
export async function POST(){try{const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please log in."},{status:401});const admin=createAdminClient();const {data:vendor,error}=await admin.from("vendors").select("id,slug,is_active,activation_reference").eq("owner_id",user.id).single();if(error||!vendor)return NextResponse.json({error:"Shop not found."},{status:404});if(vendor.is_active)return NextResponse.json({active:true});const reference=`ACT_${vendor.id}_${Date.now()}`;const response=await paystackRequest<Resp>("/transaction/initialize",{email:user.email,amount:toPesewas(SETUP_FEE_GHS),currency:"GHS",reference,metadata:{type:"VENDOR_ACTIVATION",vendor_id:vendor.id}});await admin.from("vendors").update({activation_reference:reference}).eq("id",vendor.id);return NextResponse.json({authorizationUrl:response.data.authorization_url});}catch{return NextResponse.json({error:"Activation payment cannot be started right now."},{status:503});}}
