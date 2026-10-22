import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="container legal-page max-w-3xl py-8 sm:py-12"><article className="legal-document card">
        <Link className="text-sm underline" href="/">← SeePay home</Link>
        <h1 className="display mt-5 text-4xl font-bold">Terms of service</h1>
        <p className="muted mt-5">These terms explain the rules for using SeePay.</p>
        <h2 className="display mt-7 text-2xl font-bold">Using SeePay</h2>
        <p className="mt-2 leading-7">Vendors are responsible for the accuracy of their business details, product descriptions, prices, fulfilment information and contact details. Customers should review their order before authorising payment.</p>
        <h2 className="display mt-7 text-2xl font-bold">Fees and payments</h2>
        <p className="mt-2 leading-7">Vendor activation is a one-time GH₵ 150 fee. SeePay charges GH₵ 0.20 per successful order. Paystack payment-processing fees apply and are deducted from the vendor share as shown where supported. Payment settlement timing is subject to Paystack and network-provider processes.</p>
        <h2 className="display mt-7 text-2xl font-bold">Orders and disputes</h2>
        <p className="mt-2 leading-7">Vendors are responsible for fulfilling paid orders and communicating with customers about delays, cancellations or refunds. These provisions need final legal and operational review before public use.</p>
        <h2 className="display mt-7 text-2xl font-bold">Contact</h2>
        <p className="mt-2 leading-7">For questions about account access, payments or these terms, email <a className="underline" href="mailto:seepay.official@proton.me">seepay.official@proton.me</a> or call <a className="underline" href="tel:+233539061011">053 906 1011</a>.</p>
      </article>
      </main>
    </>
  );
}
