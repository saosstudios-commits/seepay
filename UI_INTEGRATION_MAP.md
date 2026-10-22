# SeePay UI integration map

The exact supplied design source is `public/seepay-ui.html`. Its CSS design system is retained inline. `next.config.ts` routes the corresponding application paths to that HTML SPA; `middleware.ts` preserves vendor subdomain behavior and existing protected-page/auth checks for primary-domain routes.

| User experience / route | UI route in supplied HTML | Existing server functionality |
|---|---|---|
| Public homepage | `#/` | Static marketing content; sample numbers are illustrative |
| Vendor registration | `#/register` | `POST /api/auth/register` starts existing vendor registration and Paystack setup-fee payment |
| Agent account registration | Not included as a dedicated screen in the supplied UI | Existing `POST /api/auth/register` supports `role: "agent"`, but the current visual prototype only implements the vendor registration form; agent workspace routes are for already-registered agents |
| Login / logout | `#/login` | `POST /api/auth/login`, `POST /api/auth/logout` |
| Public storefront | `#/store` on `/store/:slug` or vendor subdomain | `GET /api/store?sub=:slug` uses existing `public_storefront` RPC |
| Shopping cart / checkout | `#/store/cart`, `#/store/checkout` | `POST /api/checkout`, `POST /api/checkout/otp`, `GET /api/orders/:reference/status` |
| Vendor dashboard | `#/vendor` and `#/vendor/*` | `GET /api/manage/overview`, `GET /api/vendor/orders` |
| Vendor products | `#/vendor/products`, `#/vendor/products/new` | `POST /api/manage/product`, `POST /api/manage/upload`, `PATCH/DELETE /api/vendor/products/:id` |
| Vendor orders | `#/vendor/orders` | `PATCH /api/vendor/orders/:id` with validated fulfilment status |
| Storefront/profile settings | `#/vendor/storefront`, `#/vendor/settings` | `PATCH /api/vendor/storefront`, `PATCH /api/vendor/profile` |
| Vendor payment destination | `#/vendor/payments` | `POST /api/vendor/payout-details` (verifies current password and updates Paystack subaccount) |
| Agent dashboard/referrals | `#/agent`, `#/agent/referrals` | `GET /api/agent/overview` |
| Agent profile | `#/agent/profile` | `PATCH /api/agent/profile` |
| Agent payouts | `#/agent/earnings` | `POST /api/agent/payout`; `GET /api/agent/overview` refreshes history |
| Administrator views | `#/admin/*` | `GET /api/admin/overview` |
| Administrator payout completion | `#/admin/payouts` | `POST /api/admin/payouts/:id` with transfer reference |
| Registration payment callback | `/register/done` | Existing Next.js callback page and Paystack verification/webhook flow are preserved |
| Password recovery link | `/reset-password` | Existing Next.js reset page; a public recovery-request API is not present |
| Terms / privacy | `/terms`, `/privacy` | Existing Next.js pages are preserved |
| Existing order details page | `/store/:slug/order/:reference` | Existing Next.js page is preserved |

## Actions intentionally not fabricated

Admin vendor activation/suspension and vendor banner/logo uploads have no corresponding safe backend operation in this source. The UI reports these as unavailable. Password recovery email/SMS delivery is likewise not claimed. The public homepage still contains illustrative marketing figures, and the supplied UI does not include an agent sign-up form. Agent workspace/profile/payout features are wired for accounts that already exist. Operational vendor, agent, storefront and administrator views clear the main demo records and load live API data. Product quantity/stock is not part of the live database schema, so the UI exposes only product availability. Admin setup-fee totals, shop page views, and branding image uploads are not available through existing safe API endpoints.
