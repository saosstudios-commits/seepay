import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Password help", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  const support = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "233539061011").replace(/\D/g, "");
  const message = encodeURIComponent("Hello SeePay support. I need help resetting my account password.");

  return (
    <main className="min-h-screen sp-reset-page">
      <SiteHeader />
      <section className="stage py-10 sm:py-16">
        <div className="container max-w-lg">
          <div className="card p-6 sm:p-8">
            <h1 className="display text-3xl font-bold">Need help signing in?</h1>
            <p className="mt-3 leading-7">For your safety, we need to verify your account before changing a password. Email recovery is not yet configured for SeePay’s phone-based sign-in accounts.</p>
            <p className="muted mt-4 text-sm">Contact support and ask for a password reset. Never share your current password or Mobile Money PIN.</p>
            {support && <a className="btn mt-5 w-full" href={`https://wa.me/${support}?text=${message}`} target="_blank" rel="noreferrer">Contact SeePay support on WhatsApp</a>}
            <div className="mt-4 grid gap-2 text-sm">
              <a className="underline" href="mailto:seepay.official@proton.me">Email: seepay.official@proton.me</a>
              <a className="underline" href="tel:+233539061011">Call: 053 906 1011</a>
            </div>
            <Link href="/login" className="mt-5 block text-center text-sm font-semibold underline">Back to log in</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
