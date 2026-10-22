import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, Hanken_Grotesk } from "next/font/google";
import DesignMotion from "@/components/DesignMotion";
import "./globals.css";

const familjen = Familjen_Grotesk({ subsets: ["latin"], variable: "--font-familjen", weight: ["500", "700"] });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", weight: ["400", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "seepay.shop"}`),
  title: { default: "SeePay — Give your hustle a bigger stage", template: "%s | SeePay" },
  description: "Launch a beautiful online shop in Ghana, manage orders and accept supported Mobile Money payments. One-time shop setup; no monthly SeePay subscription.",
  openGraph: {
    title: "SeePay — Give your hustle a bigger stage",
    description: "Launch a beautiful online shop in Ghana, manage orders and accept supported Mobile Money payments. One-time shop setup; no monthly SeePay subscription.",
    type: "website",
    siteName: "SeePay",
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B2E21",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${familjen.variable} ${hanken.variable}`}>
      <body>
        <DesignMotion />
        {children}
      </body>
    </html>
  );
}
