import type { Metadata } from "next";
import RegisterDoneClient from "@/components/RegisterDoneClient";
export const metadata:Metadata={title:"Confirming your payment",robots:{index:false,follow:false}};
export default async function RegisterDone({searchParams}:{searchParams:Promise<{ref?:string}>}){const {ref=""}=await searchParams;return <RegisterDoneClient reference={ref}/>;}
