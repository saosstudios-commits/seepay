import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck, Store } from "lucide-react";
import LoginForm from "@/components/LoginForm";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="min-h-screen sp-auth-page sp-auth-page--login">
      <SiteHeader />
      <section className="stage py-8 sm:py-12 lg:py-16">
        <div className="container">
          <div className="sp-auth-layout">
            <aside className="sp-auth-aside">
              <span className="sp-auth-kicker"><ShieldCheck size={16} aria-hidden="true" /> SECURE ACCOUNT ACCESS</span>
              <h2 className="display mt-6 text-3xl font-bold sm:text-4xl">Your business, one sign-in away.</h2>
              <p className="mt-4 text-sm leading-7 text-white/75">
                Get back to the tools that help you run your SeePay shop and serve your customers.
              </p>
              <ul className="sp-auth-checks mt-7">
                <li><CheckCircle2 size={18} aria-hidden="true" /> Manage products and orders</li>
                <li><CheckCircle2 size={18} aria-hidden="true" /> Share your shop link</li>
                <li><CheckCircle2 size={18} aria-hidden="true" /> Review sales and account activity</li>
              </ul>
              <div className="sp-auth-aside-foot mt-8">
                <Store size={18} aria-hidden="true" />
                <span>Built for small businesses in Ghana.</span>
              </div>
            </aside>
            <div className="sp-auth-content">
              <p className="sp-auth-eyebrow">WELCOME BACK</p>
              <h1 className="display mt-2 text-4xl font-bold sm:text-5xl">Log in to SeePay.</h1>
              <p className="muted mt-3">Sign in with the phone number and password you registered with.</p>
              <div className="card mt-6 p-5 sm:p-7"><LoginForm next={next || ""} /></div>
              <p className="mt-5 text-center text-sm sm:text-left">
                New to SeePay? <a href="/register" className="font-bold underline">Create an account</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
