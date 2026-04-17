import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aspera — Personal Performance",
  description: "Track your habits and unlock your patterns.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-text min-h-screen">{children}</body>
    </html>
  );
}
