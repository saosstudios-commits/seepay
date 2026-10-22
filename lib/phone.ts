import { z } from "zod";
export function normalizeGhanaPhone(value: string): string | null {
 const digits=value.trim().replace(/[\s()-]/g,"");
 if(/^0\d{9}$/.test(digits)) return digits;
 if(/^\+233\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
 if(/^233\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
 return null;
}
export const ghanaPhoneSchema=z.string().transform(v=>normalizeGhanaPhone(v)).refine((v): v is string=>v!==null,{message:"Enter a 10-digit Ghana phone number, like 024 123 4567."});
export function suggestedNetwork(phone:string):"MTN"|"VODAFONE"|"AIRTELTIGO"|null {
 const prefix=phone.slice(0,3); if(["024","054","055","059","053"].includes(prefix)) return "MTN"; if(["020","050"].includes(prefix)) return "VODAFONE"; if(["026","027","056","057"].includes(prefix)) return "AIRTELTIGO"; return null;
}
