import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp,enforceRateLimit } from "@/lib/rate-limit";
export async function GET(request:Request){try{if(!await enforceRateLimit(`referral:${clientIp(request)}`,60,60))return NextResponse.json({error:"Too many code checks. Try again shortly."},{status:429});const code=z.string().trim().toUpperCase().regex(/^[A-Z0-9]{5,12}$/).safeParse(new URL(request.url).searchParams.get("code")||"");if(!code.success)return NextResponse.json({valid:false});const db=createAdminClient();const {data,error}=await db.from("agents").select("id").eq("referral_code",code.data).maybeSingle();if(error)throw error;return NextResponse.json({valid:!!data});}catch{return NextResponse.json({error:"Agent codes cannot be checked right now."},{status:503});}}
