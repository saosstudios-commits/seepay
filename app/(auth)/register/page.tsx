import type { Metadata } from "next";
import { CheckCircle2, UsersRound } from "lucide-react";
import RegisterForm from "@/components/RegisterForm";
import { Awning } from "@/components/ui/Brand";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Create your shop" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ as?: string; ref?: string; slug?: string }> }) {
  const q = await searchParams;
  const isAgent = q.as === "agent";
  const benefits = isAgent
    ? [
        "Get your personal referral code",
        "Earn GH₵ 50 when a referred shop pays its setup fee",
        "Track referrals and payout requests in your workspace",
      ]
    : [
        "Get a simple online storefront for your business",
        "Let customers place orders from one shareable link",
        "Accept Mobile Money payments through Paystack",
      ];

  return (
    <main className="min-h-screen sp-auth-page sp-auth-page--register">
      <SiteHeader />
      <section className="stage relative">
        <Awning />
        <div className="container py-8 sm:py-12 lg:py-14">
          <div className="sp-auth-layout sp-auth-layout--register">
            <aside className="sp-auth-aside">
              <span className="sp-auth-kicker"><UsersRound size={16} aria-hidden="true" /> {isAgent ? "AGENT REGISTRATION" : "SELL ONLINE WITH SEEPAY"}</span>
              <h2 className="display mt-6 text-3xl font-bold sm:text-4xl">
                {isAgent ? "Turn local connections into earnings." : "A shop link is all you need."}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/75">
                {isAgent
                  ? "Introduce local businesses to SeePay and keep track of the shops you refer."
                  : "Bring your products or services online without needing to build a website yourself."}
              </p>
              <ul className="sp-auth-checks mt-7">
                {benefits.map((benefit) => (
                  <li key={benefit}><CheckCircle2 size={18} aria-hidden="true" /> {benefit}</li>
                ))}
              </ul>
              <div className="sp-auth-aside-foot mt-8">
                <span className="sp-auth-dot" aria-hidden="true" />
                {isAgent ? "Your referral workspace, all in one place." : "No monthly SeePay subscription fee."}
              </div>
            </aside>
            <div className="sp-auth-content">
              <p className="sp-auth-eyebrow">CREATE YOUR ACCOUNT</p>
              <h1 className="display mt-2 text-4xl font-bold sm:text-5xl">
                {isAgent ? "Become a SeePay agent." : "Let’s set up your SeePay."}
              </h1>
              <p className="muted mt-3 max-w-xl">
                {isAgent
                  ? "Enter your details to create an agent account. You can switch to a shop account in the form."
                  : "A few details first. Your customers can order from your shop once it is ready."}
              </p>
              <div className="mt-6">
                <RegisterForm initialRole={isAgent ? "agent" : "vendor"} initialRef={q.ref || ""} initialSlug={q.slug || ""} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <p className="container py-7 text-center text-sm muted">
        Already have an account? <a className="font-bold underline" href="/login">Log in</a>
      </p>
    </main>
  );
}
