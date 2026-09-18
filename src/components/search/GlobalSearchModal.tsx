"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Asset } from "@/lib/market/catalog";
import { Search, X, Bell, Star, Eye, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export function GlobalSearchModal() {
  const {
    isSearchOpen,
    setIsSearchOpen,
    openCreateAlert,
    openAssetWorkspace,
    watchlist,
    favorites,
    toggleWatchlist,
    toggleFavorite,
  } = useApp();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isSearchOpen]);

  // Debounced search fetch
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/market/search?q=${encodeURIComponent(query)}&limit=12`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setResults(data.data || []);
          }
        })
        .catch((e) => console.warn("Search error:", e))
        .finally(() => setIsLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-amber-500/10 overflow-hidden font-sans text-slate-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <Search className="h-5 w-5 text-amber-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol, name, forex (e.g. BTC, ETH, EUR/USD, Gold, SHIB)..."
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-white mr-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {isLoading && (
            <div className="p-8 text-center text-slate-400 text-xs font-mono animate-pulse">
              Searching financial catalog...
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No matching assets found for &quot;{query}&quot;.
            </div>
          )}

          {!isLoading && !query.trim() && (
            <div className="p-6 text-center text-slate-500 text-xs">
              Type any cryptocurrency or forex symbol to instantly filter 5,000+ assets and create alerts.
            </div>
          )}

          {!isLoading &&
            results.map((asset) => {
              const isFav = favorites.includes(asset.symbol.toUpperCase());
              const isWatch = watchlist.includes(asset.symbol.toUpperCase());

              return (
                <div
                  key={asset.id}
                  className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900 transition-all"
                >
                  {/* Left: Asset info */}
                  <div
                    onClick={() => {
                      setIsSearchOpen(false);
                      openAssetWorkspace(asset);
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <img
                      src={asset.logo}
                      alt={asset.name}
                      className="h-8 w-8 rounded-full bg-slate-800 p-0.5 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as any).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${asset.symbol}`;
                      }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">
                          {asset.symbol}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {asset.name}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          #{asset.rank}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs font-mono">
                        <span className="text-white font-bold">
                          ${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span
                          className={`flex items-center gap-0.5 font-semibold ${
                            asset.change24hPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {asset.change24hPercent >= 0 ? "+" : ""}
                          {asset.change24hPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: ALERT, Favorite, Open */}
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => {
                        toggleFavorite(asset.symbol);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isFav
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                          : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                      title="Favorite"
                    >
                      <Star className={`h-4 w-4 ${isFav ? "fill-amber-400" : ""}`} />
                    </button>

                    {/* PROMINENT ALERT ACTION DIRECTLY FROM SEARCH */}
                    <button
                      onClick={() => {
                        setIsSearchOpen(false);
                        openCreateAlert(asset);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-md shadow-amber-500/20 transition-transform active:scale-95"
                    >
                      <Bell className="h-3.5 w-3.5 fill-slate-950" />
                      <span>ALERT</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsSearchOpen(false);
                        openAssetWorkspace(asset);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Open Asset Workspace"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
