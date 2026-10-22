import type { Metadata } from "next";
import OrderStatusClient from "@/components/OrderStatusClient";
export const metadata:Metadata={title:"Order status",robots:{index:false,follow:false}};
export default async function OrderStatusPage({params}:{params:Promise<{slug:string;reference:string}>}){const {slug,reference}=await params;return <OrderStatusClient slug={slug} reference={reference}/>;}
