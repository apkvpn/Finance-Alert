"use client";

import React from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Bell } from "lucide-react";

export function StickyMobileAlertButton() {
  const { openCreateAlert } = useApp();

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:hidden">
      <button
        onClick={() =>
          openCreateAlert({
            id: "bitcoin",
            symbol: "BTC",
            name: "Bitcoin",
            type: "crypto",
            rank: 1,
            price: 92450.0,
            change24h: 1850.5,
            change24hPercent: 2.04,
            high24h: 93800.0,
            low24h: 90100.0,
            volume24h: 48500000000,
            marketCap: 1820000000000,
            circulatingSupply: 19780000,
            precision: 2,
            logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
            status: "live",
            lastUpdated: new Date().toISOString(),
          })
        }
        className="flex items-center gap-2 px-4 py-3 rounded-full font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 shadow-2xl shadow-amber-500/50 border border-amber-300 active:scale-95"
      >
        <Bell className="h-4 w-4 fill-slate-950" />
        <span>ALERT</span>
      </button>
    </div>
  );
}
