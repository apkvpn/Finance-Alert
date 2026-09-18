import type { Metadata } from "next";
import { AppProvider } from "@/components/providers/AppProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Alert — Professional Real-Time Financial Monitoring Terminal",
  description: "Advanced financial monitoring platform centered around real-time alerts across 5,000+ cryptocurrencies and forex instruments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
