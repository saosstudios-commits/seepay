"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/ui/Brand";

export default function SiteHeader() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";
  const isReset = pathname === "/reset-password";

  const primary = isLogin
    ? { label: "Create account", href: "/register" }
    : isRegister
      ? { label: "Log in", href: "/login" }
      : isReset
        ? { label: "Back to log in", href: "/login" }
        : { label: "Get started", href: "/register" };

  const showAgentLink = !isRegister && !isReset;

  return (
    <header className="sp-app-header sp-site-header">
      <div className="container sp-site-header-inner flex min-h-[68px] items-center justify-between gap-4 py-3">
        <Brand light />
        <nav aria-label="Account navigation" className="sp-header-actions">
          {showAgentLink && (
            <Link className="sp-header-secondary" href="/register?as=agent">
              Become an agent
            </Link>
          )}
          <Link className="btn gold min-h-10 px-3 py-2 text-sm" href={primary.href}>
            {primary.label}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
