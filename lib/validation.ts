import { z } from "zod";
import { ghanaPhoneSchema } from "@/lib/phone";
export const networkSchema=z.enum(["MTN","VODAFONE","AIRTELTIGO"]);
const password=z.string().min(8,"Use at least 8 characters.").max(128);
export const registrationSchema=z.discriminatedUnion("role",[
 z.object({role:z.literal("vendor"),fullName:z.string().trim().min(2).max(80),businessName:z.string().trim().min(2).max(60),slug:z.string().min(3).max(30),category:z.enum(["food","salon","fashion","repairs","bakery","other"]).optional(),whatsappNumber:ghanaPhoneSchema,momoNumber:ghanaPhoneSchema,momoNetwork:networkSchema,referralCode:z.string().trim().toUpperCase().max(12).optional(),password,contactEmail:z.union([z.string().email().max(254),z.literal("")]).optional(),website:z.string().max(0).optional()}),
 z.object({role:z.literal("agent"),fullName:z.string().trim().min(2).max(80),momoNumber:ghanaPhoneSchema,momoNetwork:networkSchema,password,contactEmail:z.union([z.string().email().max(254),z.literal("")]).optional(),website:z.string().max(0).optional()})
]);
export const checkoutSchema=z.object({slug:z.string().min(3).max(30),customerName:z.string().trim().min(2).max(60),customerPhone:ghanaPhoneSchema,fulfilment:z.enum(["DELIVERY","PICKUP"]),deliveryAddress:z.string().trim().max(300).optional(),note:z.string().trim().max(200).optional(),items:z.array(z.object({productId:z.string().uuid(),quantity:z.number().int().min(1).max(20)})).min(1).max(50),momoNetwork:networkSchema,momoNumber:ghanaPhoneSchema,website:z.string().max(0).optional()}).superRefine((v,ctx)=>{if(v.fulfilment==="DELIVERY"&&!v.deliveryAddress?.trim())ctx.addIssue({code:"custom",path:["deliveryAddress"],message:"Enter a delivery address."});});
