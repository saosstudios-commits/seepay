"use client";
import { useState } from "react";
import { Check,Copy } from "lucide-react";
export default function CopyTextButton({value,label="Copy link"}:{value:string;label?:string}){const [copied,setCopied]=useState(false);async function copy(){try{await navigator.clipboard.writeText(value);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}catch{setCopied(false);}}return <button className="btn" onClick={copy}><>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?"Copied":label}</></button>}
