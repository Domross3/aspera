import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { Quicksand, Hanken_Grotesk, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import AsperaLanding from "@/components/AsperaLanding";

// Route-scoped: these three families load only on the landing page, not the app.
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-quicksand",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-hanken",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves the OG image to the real deployment (Vercel) instead of localhost.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  ),
  title: "Aspera",
  description:
    "See your habits, set your limits, and watch what changes — a private agent for your digital habits. iOS beta.",
};

export const viewport: Viewport = { themeColor: "#0a0a09" };

// Auth check reads per-request cookies → never prerender this route at build.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  // Auth-aware: signed-in users go straight to the app; everyone else sees the landing.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/log");

  return (
    <div
      className={`${quicksand.variable} ${hanken.variable} ${geistMono.variable}`}
    >
      <AsperaLanding />
    </div>
  );
}
