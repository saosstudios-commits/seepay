import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugReason } from "@/lib/slug";
import { clientIp,enforceRateLimit } from "@/lib/rate-limit";
export async function GET(request:Request){try{if(!await enforceRateLimit(`slug:${clientIp(request)}`,60,60))return NextResponse.json({error:"Too many shop link checks. Try again shortly."},{status:429});const slug=z.string().max(60).safeParse(new URL(request.url).searchParams.get("slug")||"");if(!slug.success)return NextResponse.json({valid:false,available:false,reason:"Enter a shop link."});const reason=slugReason(slug.data);if(reason)return NextResponse.json({valid:false,available:false,reason});const db=createAdminClient();const {data,error}=await db.from("vendors").select("id").eq("slug",slug.data).maybeSingle();if(error)throw error;return NextResponse.json({valid:true,available:!data,reason:data?"That shop link is taken.":null});}catch{return NextResponse.json({error:"Shop links cannot be checked right now."},{status:503});}}
