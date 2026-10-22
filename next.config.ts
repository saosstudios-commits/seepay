import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/seepay-ui.html" },
        { source: "/login", destination: "/seepay-ui.html" },
        { source: "/register", destination: "/seepay-ui.html" },
        { source: "/forgot", destination: "/seepay-ui.html" },
        { source: "/forgot-password", destination: "/seepay-ui.html" },
        { source: "/reset", destination: "/seepay-ui.html" },
        { source: "/agent", destination: "/seepay-ui.html" },
        { source: "/manage", destination: "/seepay-ui.html" },
        { source: "/shop", destination: "/seepay-ui.html" },
        { source: "/dashboard/vendor", destination: "/seepay-ui.html" },
        { source: "/dashboard/vendor/orders", destination: "/seepay-ui.html" },
        { source: "/dashboard/vendor/products", destination: "/seepay-ui.html" },
        { source: "/dashboard/vendor/products/new", destination: "/seepay-ui.html" },
        { source: "/dashboard/vendor/storefront", destination: "/seepay-ui.html" },
        { source: "/dashboard/vendor/payments", destination: "/seepay-ui.html" },
        { source: "/dashboard/vendor/settings", destination: "/seepay-ui.html" },
        { source: "/dashboard/agent", destination: "/seepay-ui.html" },
        { source: "/dashboard/agent/earnings", destination: "/seepay-ui.html" },
        { source: "/dashboard/agent/payouts", destination: "/seepay-ui.html" },
        { source: "/dashboard/agent/profile", destination: "/seepay-ui.html" },
        { source: "/dashboard/agent/referrals", destination: "/seepay-ui.html" },
        { source: "/admin", destination: "/seepay-ui.html" },
        { source: "/admin/payouts", destination: "/seepay-ui.html" },
        { source: "/admin/vendors", destination: "/seepay-ui.html" },
        { source: "/admin/agents", destination: "/seepay-ui.html" },
        { source: "/admin/orders", destination: "/seepay-ui.html" },
        { source: "/admin/activity", destination: "/seepay-ui.html" },
        { source: "/store/:slug", destination: "/seepay-ui.html" },
      ],
    };
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co https://api.paystack.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://checkout.paystack.com" },
      ],
    }];
  },
};

export default nextConfig;
