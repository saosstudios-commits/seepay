# SeePay UI refinement notes

This pass builds on the existing SeePay forest-green / gold / mint design language and keeps the original homepage HTML and rewrite config untouched.

## Further refinement in this pass
- Vendor dashboard financial hierarchy: verified sales is the featured card; pending orders is surfaced as a separate metric.
- Added a seven-day verified-sales SVG chart calculated from existing successful order records (no mock metrics or new packages).
- Added contextual quick actions for orders and products.
- Added responsive dashboard card layouts, polished hover/focus states, and reduced-motion support.
- Refined customer shop product-card interactions and checkout entrance motion without changing checkout requests or payment behavior.

## Design research
- Shadcn Examples, E-Commerce Admin Dashboard: KPI hierarchy, trend charts, operational tables, responsive grids. https://shadcnexamples.com/ecommerce-admin-dashboard
- Wandr Studio, Fintech Dashboard Design Patterns (2026): financial trust, balance hierarchy, and information clarity. https://www.wandr.studio/blog/fintech-dashboard-design-patterns
- Stripe, Checkout UI Strategies: reduce friction and keep checkout steps clear. https://stripe.com/resources/more/checkout-ui-strategies-for-faster-and-more-intuitive-transactions

These references informed patterns only; no paid components, dependencies, or assets were added.

## Verification status
- CSS parsed with tinycss2: no parse errors.
- Changed vendor dashboard TSX transpiled with TypeScript: no syntax diagnostics.
- Original homepage HTML and `next.config.ts` match the provided baseline byte-for-byte.
- Full `npm run build` remains unverified because dependencies are not installed and the earlier package-registry request failed with `EAI_AGAIN`. Run `npm install` (or the repository's lockfile-appropriate install command) and `npm run build` before merging.

## Finishing pass (2026-10-21)
- Made the vendor weekly-sales chart safer on narrow screens: compact axis values, inset data points, light grid guides, an explicit zero-sales state, and a screen-reader list of daily amounts.
- Refined operational UI for orders search and filters, product editor/catalogue cards, storefront settings and preview, agent payout balance/history, and admin payout cards.
- Tightened shared field sizing, focus visibility, long-text wrapping, mobile spacing, checkout safe-area insets, and reduced-motion behavior.
- Kept all route handlers, Supabase queries, payment/checkout requests, validation, and state transitions unchanged in this pass.
- `public/seepay-original.html` and `next.config.ts` remain unchanged so the original homepage and its routing stay protected.
- Verification for this pass: JSX/TSX syntax transpilation and CSS parsing are checked separately; a full Next.js production build still requires installing the project's dependencies.
