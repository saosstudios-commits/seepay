"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/ui/Brand";

const links = [
  ["How it works", "#how"],
  ["Discover", "#discover"],
  ["Features", "#features"],
  ["Pricing", "#pricing"],
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sp-marketing-header">
      <div className="container flex min-h-[82px] items-center justify-between gap-4 py-3">
        <Brand />
        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          {links.map(([label, href]) => <a key={label} className="sp-marketing-link" href={href}>{label}</a>)}
          <Link className="btn outline sp-nav-signin" href="/login">Sign in</Link>
          <Link className="btn gold" href="/register">Open your shop <span aria-hidden="true">↗</span></Link>
        </nav>
        <button className="sp-mobile-menu md:hidden" onClick={() => setOpen(v => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-marketing-nav">
          {open ? <X aria-hidden="true"/> : <Menu aria-hidden="true"/>}
        </button>
      </div>
      {open && <nav id="mobile-marketing-nav" aria-label="Mobile navigation" className="container sp-mobile-nav md:hidden">
        {links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
        <Link className="btn gold" href="/register" onClick={() => setOpen(false)}>Open your shop ↗</Link>
      </nav>}
    </header>
  );
}
