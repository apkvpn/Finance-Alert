"use client";

import React, { useEffect } from "react";
import { useApp, PrimaryCategory } from "@/components/providers/AppProvider";
import { Bell, Search, Sun, Moon, Sparkles, SlidersHorizontal, Activity, FileText } from "lucide-react";

export function Header() {
  const {
    activeCategory,
    setActiveCategory,
    setIsSearchOpen,
    openCreateAlert,
    theme,
    toggleTheme,
    alerts,
  } = useApp();

  const activeAlertsCount = alerts.filter((a) => a.status === "ACTIVE").length;

  // Keyboard shortcut listener for Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSearchOpen]);

  const navItems: { id: PrimaryCategory; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "HOME", label: "HOME", icon: Activity },
    { id: "NOTES", label: "NOTES", icon: FileText },
    { id: "ALERTS", label: "ALERTS", icon: Bell, count: activeAlertsCount },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 light:border-slate-200 light:bg-white/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveCategory("HOME")}
            className="flex cursor-pointer items-center gap-2.5 group"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 shadow-lg shadow-amber-500/25 transition-transform group-hover:scale-105">
              <Bell className="h-5 w-5 text-slate-950 fill-slate-950" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-200 bg-clip-text text-transparent">
                  FINANCE ALERT
                </span>
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-400 border border-amber-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Terminal & Real-Time Monitoring
              </p>
            </div>
          </div>

          {/* EXACTLY 3 PRIMARY CATEGORY NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-1.5 ml-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-slate-800/90 text-amber-400 shadow-inner border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                      {item.count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Terminal Search Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-slate-200 transition-all text-sm group shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              <span className="font-mono text-xs">Search 5,000+ Cryptos, Forex (BTC, EUR/USD...)</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Search Market"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* VERY PROMINENT CREATE ALERT MAIN ACTION */}
          <button
            onClick={() => openCreateAlert({
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
            })}
            className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Bell className="h-4 w-4 fill-slate-950 group-hover:rotate-12 transition-transform" />
            <span>CREATE ALERT</span>
            <Sparkles className="h-3.5 w-3.5 opacity-70" />
          </button>
        </div>
      </div>

      {/* Mobile Primary Category Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-800 bg-slate-950 px-2 py-1 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveCategory(item.id)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold ${
                isActive ? "text-amber-400 font-bold bg-slate-900" : "text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
