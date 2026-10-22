"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, ClipboardList, Package, Settings, Store, Wallet } from "lucide-react";

type DashboardNavProps = { variant: "agent" | "vendor" };

export default function DashboardNav({ variant }: DashboardNavProps) {
  const pathname = usePathname();
  const overviewHref = variant === "agent" ? "/dashboard/agent" : "/dashboard/vendor";
  const tabs = variant === "agent"
    ? [
        { label: "Overview", href: "/dashboard/agent", Icon: Wallet },
        { label: "Shops referred", href: "/dashboard/agent/earnings", Icon: Store },
        { label: "Payouts", href: "/dashboard/agent/payouts", Icon: Banknote },
      ]
    : [
        { label: "Overview", href: "/dashboard/vendor", Icon: Wallet },
        { label: "Orders", href: "/dashboard/vendor/orders", Icon: ClipboardList },
        { label: "Products", href: "/dashboard/vendor/products", Icon: Package },
        { label: "Storefront", href: "/dashboard/vendor/storefront", Icon: Store },
        { label: "Settings", href: "/dashboard/vendor/settings", Icon: Settings },
      ];

  return (
    <nav aria-label={variant === "agent" ? "Agent sections" : "Vendor sections"} className={`sp-dashboard-nav sp-dashboard-nav--${variant}`}>
      {tabs.map(({ label, href, Icon }) => {
        const active = pathname === href || (href !== overviewHref && pathname.startsWith(`${href}/`));
        return (
          <Link key={href} href={href} className="sp-dashboard-tab shrink-0" aria-current={active ? "page" : undefined}>
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
            <span className="sp-nav-indicator" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
