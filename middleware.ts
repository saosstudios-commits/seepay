import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "seepay.shop").toLowerCase();
const RESERVED = new Set(["www", "app", "api", "admin", "agent", "register", "login", "dashboard", "store", "support", "help", "mail", "seepay", "terms", "privacy"]);

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(":")[0].toLowerCase();
  const url = request.nextUrl.clone();

  // The apex domain is configured in Vercel to redirect to www. Do not redirect
  // www back to the apex here, or requests will loop between the two domains.

  const production = process.env.NODE_ENV === "production";
  const isApiPath = url.pathname.startsWith("/api/");
  const preservePage =
    url.pathname === "/seepay-ui.html" ||
    url.pathname === "/register/done" ||
    url.pathname === "/reset-password" ||
    url.pathname === "/terms" ||
    url.pathname === "/privacy" ||
    url.pathname === "/robots.txt" ||
    url.pathname === "/sitemap.xml" ||
    /^\/store\/[^/]+\/order\/[^/]+$/.test(url.pathname);
  if (!isApiPath && !preservePage && host.endsWith(`.${ROOT}`) && host !== `www.${ROOT}`) {
    const slug = host.slice(0, -(`.${ROOT}`).length);
    if (slug && !RESERVED.has(slug)) {
      // Serve the selected UI on vendor subdomains while leaving the browser
      // pathname intact for the UI router. API routes, registration callbacks,
      // legal pages and the real order-status page continue through Next.js.
      url.pathname = "/seepay-ui.html";
      return NextResponse.rewrite(url);
    }
  }
  if (!production && url.searchParams.has("shop") && ["/", "/shop"].includes(url.pathname)) {
    // Static storefront HTML reads ?shop=<slug> on preview/local hosts.
    url.pathname = "/seepay-ui.html";
    return NextResponse.rewrite(url);
  }

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && publicKey) {
    const supabase = createServerClient(supabaseUrl, publicKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (url.pathname.startsWith("/dashboard/") || url.pathname === "/admin" || url.pathname.startsWith("/admin/") || url.pathname === "/manage") {
      if (!user) {
        const login = new URL("/login", request.url);
        login.searchParams.set("next", url.pathname);
        return NextResponse.redirect(login);
      }
      if ((url.pathname === "/admin" || url.pathname.startsWith("/admin/")) && user.app_metadata?.role !== "admin") {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (data?.role !== "admin") return NextResponse.redirect(new URL("/dashboard/vendor", request.url));
      }
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
  runtime: "nodejs",
};
