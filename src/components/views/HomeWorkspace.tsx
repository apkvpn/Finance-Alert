"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Asset } from "@/lib/market/catalog";
import {
  Search,
  Bell,
  Star,
  Eye,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  Newspaper,
  Filter,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";

export function HomeWorkspace() {
  const {
    openCreateAlert,
    openAssetWorkspace,
    setIsNewsOpen,
    watchlist,
    favorites,
    toggleWatchlist,
    toggleFavorite,
  } = useApp();

  const [activeTab, setActiveCategoryTab] = useState<"all" | "crypto" | "forex" | "watchlist" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change24hPercent" | "volume24h" | "marketCap">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | HTMLTableRowElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore]
  );

  // Fetch paginated market assets
  const fetchMarketAssets = useCallback(
    async (pageNum: number, isReset: boolean = false) => {
      setIsLoading(true);
      try {
        let typeParam = "all";
        if (activeTab === "crypto") typeParam = "crypto";
        if (activeTab === "forex") typeParam = "forex";

        const url = `/api/market/list?page=${pageNum}&limit=50&query=${encodeURIComponent(
          searchQuery
        )}&type=${typeParam}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

        const res = await fetch(url);
        const result = await res.json();

        if (result.success) {
          let fetched: Asset[] = result.data || [];

          // Local watchlist / favorites filter if selected
          if (activeTab === "watchlist") {
            fetched = fetched.filter((a) => watchlist.includes(a.symbol.toUpperCase()));
          } else if (activeTab === "favorites") {
            fetched = fetched.filter((a) => favorites.includes(a.symbol.toUpperCase()));
          }

          if (isReset) {
            setAssets(fetched);
          } else {
            setAssets((prev) => [...prev, ...fetched]);
          }

          setTotalAssets(result.pagination?.total || fetched.length);
          setHasMore(result.pagination?.hasMore ?? false);
        }
      } catch (e) {
        console.warn("Error loading market assets:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, searchQuery, sortBy, sortOrder, watchlist, favorites]
  );

  // Reset page when filters or tabs change
  useEffect(() => {
    setPage(1);
    fetchMarketAssets(1, true);
  }, [activeTab, searchQuery, sortBy, sortOrder, fetchMarketAssets]);

  // Load next page on scroll
  useEffect(() => {
    if (page > 1) {
      fetchMarketAssets(page, false);
    }
  }, [page, fetchMarketAssets]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Home Market Workspace Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-extrabold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>SUPPORTING 5,000+ CRYPTOCURRENCIES & FOREX</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Real-Time Financial Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Monitor live market ticks, track technical price gaps, and set instant high-precision alert triggers across 5,000+ assets with background server evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* In-App News Drawer Trigger */}
            <button
              onClick={() => setIsNewsOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white font-bold text-xs transition-colors shadow-lg"
            >
              <Newspaper className="h-4 w-4 text-amber-400" />
              <span>MARKET NEWS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Bar & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-2 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-inner">
        {/* Market Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1">
          {[
            { id: "all", label: `ALL ASSETS (${totalAssets > 0 ? totalAssets : "5,000+"})` },
            { id: "crypto", label: "CRYPTOCURRENCY (5,000+)" },
            { id: "forex", label: "FOREX INSTRUMENTS" },
            { id: "watchlist", label: `WATCHLIST (${watchlist.length})` },
            { id: "favorites", label: `FAVORITES (${favorites.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-slate-900 text-amber-400 border border-amber-500/30 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter & View Mode Controls */}
        <div className="flex items-center gap-2 px-1">
          {/* Quick Search Input */}
          <div className="relative flex-1 lg:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter assets..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 py-1.5 pl-8 pr-3 text-xs font-semibold text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Table / Grid View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assets Content Display */}
      {viewMode === "table" ? (
        /* DENSE FINANCIAL TERMINAL TABLE */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
          <table className="w-full text-left text-xs text-slate-200 border-collapse">
            <thead className="bg-slate-900/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("rank")}>
                  <div className="flex items-center gap-1">
                    <span>#</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">ASSET & SYMBOL</th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort("price")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>PRICE ($)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort("change24hPercent")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>24H CHANGE</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right hidden sm:table-cell">24H HIGH / LOW</th>
                <th className="py-3.5 px-4 text-right hidden md:table-cell cursor-pointer hover:text-white" onClick={() => handleSort("volume24h")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>24H VOLUME</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right hidden lg:table-cell cursor-pointer hover:text-white" onClick={() => handleSort("marketCap")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>MARKET CAP / INFO</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">ALERT ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 font-mono">
              {assets.map((asset, index) => {
                const isLast = index === assets.length - 1;
                const isFav = favorites.includes(asset.symbol.toUpperCase());
                const isWatch = watchlist.includes(asset.symbol.toUpperCase());
                const isPos = asset.change24hPercent >= 0;
                const precision = asset.precision || 2;

                return (
                  <tr
                    key={`${asset.id}_${index}`}
                    ref={isLast ? lastElementRef : null}
                    className="group hover:bg-slate-900/80 transition-colors"
                  >
                    {/* Rank & Star */}
                    <td className="py-3 px-4 font-sans text-slate-500 font-semibold">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavorite(asset.symbol)}
                          className="text-slate-600 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`h-3.5 w-3.5 ${isFav ? "text-amber-400 fill-amber-400" : ""}`} />
                        </button>
                        <span>{asset.rank}</span>
                      </div>
                    </td>

                    {/* Logo & Symbol Name */}
                    <td className="py-3 px-4 font-sans">
                      <div
                        onClick={() => openAssetWorkspace(asset)}
                        className="flex items-center gap-3 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                      >
                        <img
                          src={asset.logo}
                          alt={asset.name}
                          className="h-8 w-8 rounded-full bg-slate-900 p-0.5 object-contain shrink-0"
                          onError={(e) => {
                            (e.target as any).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${asset.symbol}`;
                          }}
                        />
                        <div className="truncate">
                          <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                            <span>{asset.symbol}</span>
                            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              {asset.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {asset.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-bold text-white text-sm">
                      ${asset.price.toLocaleString("en-US", { minimumFractionDigits: precision })}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3 px-4 text-right font-bold">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs ${
                          isPos
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isPos ? "+" : ""}
                        {asset.change24hPercent.toFixed(2)}%
                      </span>
                    </td>

                    {/* 24h High/Low */}
                    <td className="py-3 px-4 text-right hidden sm:table-cell text-slate-400 text-[11px]">
                      <div>H: ${asset.high24h.toLocaleString("en-US", { minimumFractionDigits: precision })}</div>
                      <div>L: ${asset.low24h.toLocaleString("en-US", { minimumFractionDigits: precision })}</div>
                    </td>

                    {/* Volume */}
                    <td className="py-3 px-4 text-right hidden md:table-cell text-slate-300 font-semibold text-xs">
                      ${(asset.volume24h / 1e6).toFixed(1)}M
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-4 text-right hidden lg:table-cell text-slate-300 font-semibold text-xs">
                      {asset.type === "crypto"
                        ? `$${(asset.marketCap / 1e9).toFixed(2)}B`
                        : `${asset.spread || 0.0002} pts`}
                    </td>

                    {/* PROMINENT ALERT ACTION */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openCreateAlert(asset)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-md shadow-amber-500/20 transition-transform active:scale-95"
                      >
                        <Bell className="h-3.5 w-3.5 fill-slate-950" />
                        <span>ALERT</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID CARD SYSTEM */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset, index) => {
            const isLast = index === assets.length - 1;
            const isFav = favorites.includes(asset.symbol.toUpperCase());
            const isPos = asset.change24hPercent >= 0;
            const precision = asset.precision || 2;

            return (
              <div
                key={`${asset.id}_${index}`}
                ref={isLast ? lastElementRef : null}
                className="group relative flex flex-col justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all shadow-lg space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => openAssetWorkspace(asset)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <img
                      src={asset.logo}
                      alt={asset.name}
                      className="h-10 w-10 rounded-full bg-slate-900 p-1 object-contain"
                      onError={(e) => {
                        (e.target as any).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${asset.symbol}`;
                      }}
                    />
                    <div>
                      <div className="font-extrabold text-white text-base">
                        {asset.symbol}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[120px]">
                        {asset.name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFavorite(asset.symbol)}
                    className="text-slate-600 hover:text-amber-400 transition-colors p-1"
                  >
                    <Star className={`h-4 w-4 ${isFav ? "text-amber-400 fill-amber-400" : ""}`} />
                  </button>
                </div>

                <div className="font-mono">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Current Price</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    ${asset.price.toLocaleString("en-US", { minimumFractionDigits: precision })}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 text-xs font-bold mt-1 ${
                      isPos ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {isPos ? "+" : ""}
                    {asset.change24hPercent.toFixed(2)}%
                  </div>
                </div>

                {/* Card Alert Button */}
                <button
                  onClick={() => openCreateAlert(asset)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-md shadow-amber-500/20 transition-transform active:scale-95"
                >
                  <Bell className="h-4 w-4 fill-slate-950" />
                  <span>CREATE ALERT</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Loading Indicator */}
      {isLoading && (
        <div className="py-8 text-center text-xs font-mono text-amber-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
          <span>Progressively loading 5,000+ universe...</span>
        </div>
      )}
    </div>
  );
}
