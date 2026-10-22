import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="container legal-page max-w-3xl py-8 sm:py-12"><article className="legal-document card">
        <Link className="text-sm underline" href="/">← SeePay home</Link>
        <h1 className="display mt-5 text-4xl font-bold">Privacy policy</h1>
        <p className="muted mt-5">This policy explains how SeePay uses personal information under Ghana’s Data Protection Act, 2012 (Act 843).</p>
        <h2 className="display mt-7 text-2xl font-bold">Information collected</h2>
        <p className="mt-2 leading-7">SeePay may collect a user’s name, phone number, optional contact email, business and storefront details, product listings, order details, payment references, referral records, payout details, and basic security logs needed to operate the service.</p>
        <h2 className="display mt-7 text-2xl font-bold">Why we use it</h2>
        <p className="mt-2 leading-7">Information is used to create and protect accounts, display storefronts, process payments, fulfil orders, calculate agent commissions, handle payout requests, provide support, and detect abuse. Paystack processes payment information under its own terms and privacy notice.</p>
        <h2 className="display mt-7 text-2xl font-bold">Sharing and retention</h2>
        <p className="mt-2 leading-7">Information is shared only as needed with payment, hosting, database and messaging providers to operate the service or where legally required. Retention periods, access-request procedures, the data controller identity and contact details must be confirmed before launch.</p>
        <h2 className="display mt-7 text-2xl font-bold">Your choices</h2>
        <p className="mt-2 leading-7">For questions or requests involving personal information, contact SeePay at <a className="underline" href="mailto:seepay.official@proton.me">seepay.official@proton.me</a> or call <a className="underline" href="tel:+233539061011">053 906 1011</a>.</p>
      </article>
      </main>
    </>
  );
}
