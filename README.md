# SeePay — integrated UI build

## Current production-readiness status

Operational product, order, referral, payout, vendor, agent, and admin collections now start empty and are populated by authenticated API responses rather than seeded records. The root-domain sample storefront and floating all-pages developer navigator are disabled. Marketing illustrations show example flows only; they are not claims of active customers or completed transactions.

This repository is **not yet a verified production deployment**. The currently authorized Supabase connection reports no accessible project, and the connected Vercel account lacks permission to create a SeePay project. Do not accept live payments until the correct Supabase project is selected, the migration is applied and verified, the Vercel Preview build passes, and Paystack test transactions and signed webhooks are validated.

This source package integrates the supplied Qwen HTML prototype into the existing SeePay Next.js application. The prototype's visual styling—its original CSS tokens, layouts, typography, component classes and animations—is preserved in `public/seepay-ui.html`. Integration work is primarily the JavaScript bridge and route rewrites needed to connect the UI to existing server APIs.

## What is wired

- Main site, sign-in, vendor registration, and the vendor/agent/admin UI routes are routed to the supplied HTML UI while the existing Next.js App Router, middleware, API handlers, server utilities, Supabase integration, and Paystack webhook remain in the source tree.
- Public store pages read the actual vendor storefront and available products from `/api/store?sub=...`.
- Vendor workspace reads the signed-in vendor's store settings, products and orders from existing authenticated APIs. Product image upload, create/edit/delete, availability toggles, fulfilment status updates, store settings, and payout-destination updates use their existing server handlers.
- Checkout posts product IDs and quantities to the existing server checkout API; server-side product prices and Paystack payment responses remain authoritative. The bridge polls the existing order-status endpoint.
- Agent workspace, profile, referral, earnings and payout requests use existing authenticated agent APIs. The supplied design does not include a dedicated agent sign-up form; the existing registration API can create agent accounts but that form is not part of this UI integration.
- Administrator overview and payout processing use existing restricted APIs. Actions without an existing safe server endpoint explicitly report that the operation is unavailable rather than showing a fake success.
- Referral-code query parameters and vendor-subdomain routing are preserved.

## Important limitations (not silently mocked)

- Password recovery delivery is not wired because the existing backend has no public recovery-request handler. The HTML UI reports that fact instead of claiming an email/SMS was sent. The separate `/reset-password` Next.js page remains available for a valid Supabase recovery link.
- Administrator vendor activation/suspension is not available as an API operation in the current backend; the UI will not change a vendor status locally.
- Uploading a vendor banner/logo is not exposed by the existing backend. Product-photo upload is supported and uses the existing WebP upload API.
- The prototype still contains illustrative figures on the public marketing page. Operational vendor, agent, storefront and administrator views clear demo records and load live API data. Stock counts, shop-view analytics, setup-fee totals, vendor brand-image uploads, and admin vendor activation/suspension are not exposed by the existing backend operations; the integration does not fabricate these actions or metrics.

## Local development

`.env.example` contains blank configuration placeholders only. Copy it to `.env.local` for local development. Never commit `.env.local` or share secret keys in chat.

1. Use Node.js 20 or 22 and npm.
2. Copy `.env.example` to `.env.local` and fill in the real environment variables locally. Do not commit `.env.local` or paste any secret keys into source files.
3. Install dependencies: `npm install`.
4. Start the app: `npm run dev`.
5. Before deploying, run `npm run typecheck` and `npm run build`, then test auth, product management, storefronts, checkout, Paystack test payments/webhook, order statuses, and agent payouts in a Vercel Preview environment.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the backward-compatible anon key)
- `SUPABASE_SECRET_KEY` (or backward-compatible `SUPABASE_SERVICE_ROLE_KEY`), server-side only
- `PAYSTACK_SECRET_KEY`, server-side only
- `NEXT_PUBLIC_ROOT_DOMAIN` (configure only after preview testing)
- `NEXT_PUBLIC_SUPPORT_WHATSAPP` (defaults to SeePay support WhatsApp `233539061011`)

Customer support: `seepay.official@proton.me` · `053 906 1011`.

Use a newly rotated **Paystack TEST** secret in Preview. Never place secret/service-role keys in browser code or commit them. Rotate any credential that has previously been exposed.

## Before production

This branch is a source change, not a deployment. Run `npm install`, `npm run typecheck`, and `npm run build`, then test registration, sign-in, image storage, storefront routing, checkout, activation, webhook retries, order updates and agent payout workflows in a separate Vercel Preview. Do not switch the production domain until those checks pass. The connected Supabase account reports no accessible projects, and Vercel cannot create the SeePay project with its current permissions.
