import { createAdminClient } from "@/lib/supabase/admin";
export function internationalGhana(phone:string){return `233${phone.replace(/^0/,"")}`;}
export async function sendOrderNotification(orderId:string){
 const key=process.env.ARKESEL_API_KEY;const sender=process.env.ARKESEL_SENDER_ID;
 if(!key||!sender)return; // SMS is optional until credentials and sender approval are supplied.
 const db=createAdminClient();
 const {data:order,error}=await db.from("orders").select("id,reference,total_amount,customer_name,vendor_id,order_items(id),vendor:vendors(business_name,whatsapp_number)").eq("id",orderId).single();
 if(error||!order)return;
 const vendor=order.vendor as unknown as {business_name:string;whatsapp_number:string}|null;
 if(!vendor?.whatsapp_number)return;
 const count=Array.isArray(order.order_items)?order.order_items.length:0;
 const amount=Number(order.total_amount).toFixed(2);
 const shopUrl=`https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN||"seepay.shop"}/dashboard/vendor/orders`;
 const message=`SeePay: New paid order GH₵ ${amount} from ${order.customer_name} (${count} items). Open your orders: ${shopUrl}`;
 const recipient=internationalGhana(vendor.whatsapp_number);
 let ok=false;let providerResponse:unknown={error:"SMS provider request was not completed."};
 try{const response=await fetch("https://sms.arkesel.com/api/v2/sms/send",{method:"POST",headers:{"api-key":key,"Content-Type":"application/json"},body:JSON.stringify({sender,message,recipients:[recipient]}),cache:"no-store"});providerResponse=await response.json();ok=response.ok&&(providerResponse as {status?:string}).status==="success";}catch{providerResponse={error:"SMS provider was unavailable."};}
 await db.from("sms_log").insert({order_id:order.id,recipient,message,ok,provider_response:providerResponse});
}
