# SeePay integration / deployment status

## Current handoff

- The supplied Qwen HTML prototype is integrated as `public/seepay-ui.html`; its CSS design system and layout are preserved, with API bridge code and minimal route/form hooks added for backend integration.
- `next.config.ts` routes the main UI paths to the supplied HTML SPA. `middleware.ts` retains primary-domain authentication guards, preserves registration callback/legal/order-status pages, and serves the UI at non-reserved vendor subdomain roots.
- Existing Next.js App Router pages, API handlers, Supabase helpers, migration files, and Paystack webhook remain in the repository. Do not replace the database schema or credentials with anything from a design model.
- `UI_INTEGRATION_MAP.md` lists routes, APIs and known unavailable actions. No production deployment was performed as part of this source handoff.

## Verification done in this environment

- Both inline JavaScript blocks in `public/seepay-ui.html` pass `node --check`.
- The inline CSS parses without reported CSS syntax errors.
- All 93 TypeScript/TSX files passed syntax transpilation.
- The expected existing API route handlers for the integration bridge are present.
- A full `npm install`, semantic TypeScript check and Next.js production build were **not** completed: the package installation attempt timed out in this environment. Run the checks below before deploying.

## Before Preview deployment

1. In a local checkout, copy `.env.example` to `.env.local` and configure the correct Supabase URL and publishable key, server-only Supabase secret, and a newly rotated Paystack TEST secret.
2. Run `npm install`, `npm run typecheck`, and `npm run build`.
3. Push this directory structure to a separate GitLab repository/branch and create a Vercel **Preview** deployment. Do not alter the currently connected production project just to test the new UI.
4. Test vendor and agent registration, login/logout, public vendor store data, product create/edit/delete and uploads, store settings, checkout initialization, Paystack TEST payment/webhook, order status, and agent payouts.
5. Verify admin APIs under an administrator session. Unsupported vendor activation/suspension, password-recovery delivery, and vendor branding uploads must remain reported as unavailable until real backend operations exist.
6. Only after Preview passes should the production project/domain be switched.

Do not put real secret or service-role keys in the ZIP, source control, browser code, or chat. Rotate previously exposed credentials before reuse.
