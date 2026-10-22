import { NextResponse, after } from "next/server";
import { sendOrderNotification } from "@/lib/arkesel";
import { verifyPaystackSignature } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime="nodejs";
type Event={event:string;data:{reference?:string;amount?:number;currency?:string;fees?:number;channel?:string;status?:string;metadata?:{type?:string;vendor_id?:string;order_id?:string}}};
export async function POST(request:Request){const raw=await request.text();if(!verifyPaystackSignature(raw,request.headers.get("x-paystack-signature")))return NextResponse.json({error:"Invalid webhook signature."},{status:401});let event:Event;try{event=JSON.parse(raw) as Event;}catch{return NextResponse.json({error:"Invalid webhook payload."},{status:400});}const reference=event.data?.reference;if(!reference||!event.event)return NextResponse.json({error:"Webhook event is incomplete."},{status:400});try{const db=createAdminClient();const eventKey=`${event.event}:${reference}`;const {error:logError}=await db.from("webhook_events").insert({event_key:eventKey,payload:event});if(logError){if(logError.code==="23505")return NextResponse.json({received:true,duplicate:true});throw logError;}
 if(event.event==="charge.success"&&event.data.currency==="GHS"&&typeof event.data.amount==="number"){
  if(event.data.metadata?.type==="VENDOR_ACTIVATION"&&event.data.amount>=15000&&event.data.metadata.vendor_id){await db.rpc("activate_vendor",{p_vendor:event.data.metadata.vendor_id,p_reference:reference,p_amount_pesewas:event.data.amount});}
  if(event.data.metadata?.type==="ORDER"){const {data:paidOrderId}=await db.rpc("mark_order_paid",{p_reference:reference,p_amount_pesewas:event.data.amount,p_fees_pesewas:typeof event.data.fees==="number"?event.data.fees:0,p_network:event.data.channel||""});if(paidOrderId)after(async()=>{try{await sendOrderNotification(paidOrderId);}catch{/* Notification errors must not change the payment result. */}});}
 }else if(["charge.failed","transfer.failed"].includes(event.event)){await db.from("orders").update({payment_status:"FAILED"}).eq("reference",reference).eq("payment_status","PENDING");}
 return NextResponse.json({received:true});
 }catch{return NextResponse.json({error:"Webhook could not be processed."},{status:500});}}
