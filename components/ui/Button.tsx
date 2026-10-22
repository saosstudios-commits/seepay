import type { ButtonHTMLAttributes } from "react";
export function Button({ className = "", tone = "ink", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ink" | "gold" | "outline" }) { return <button className={`btn ${tone === "gold" ? "gold" : tone === "outline" ? "outline" : ""} ${className}`} {...props}/>; }
