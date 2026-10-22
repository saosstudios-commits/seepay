import { createAdminClient } from "@/lib/supabase/admin";
export async function enforceRateLimit(key:string,max:number,windowSeconds:number){const db=createAdminClient();const {data,error}=await db.rpc("check_rate_limit",{p_key:key,p_max:max,p_window_seconds:windowSeconds});if(error)throw new Error("Rate limiter is unavailable.");return data===true;}
export function clientIp(request:Request){return request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";}
