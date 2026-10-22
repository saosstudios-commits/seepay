import Link from "next/link";
import DashboardNav from "@/components/DashboardNav";
import { Brand } from "@/components/ui/Brand";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sp-app-header">
        <div className="container flex min-h-[72px] items-center justify-between gap-4 py-3">
          <Brand light />
          <span className="hidden text-sm font-semibold text-[#CFE9DB] sm:inline">Agent workspace</span>
          <Link href="/dashboard/agent" className="btn gold min-h-10 px-3 py-2 text-sm">
            My earnings
          </Link>
        </div>
      </header>
      <div className="container">
        <DashboardNav variant="agent" />
      </div>
      {children}
    </>
  );
}
