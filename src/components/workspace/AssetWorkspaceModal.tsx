"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { HistoricalPoint } from "@/lib/market/providers";
import {
  X,
  Bell,
  Star,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart2,
  RefreshCw,
  ExternalLink,
  Layers,
} from "lucide-react";

export function AssetWorkspaceModal() {
  const {
    selectedAsset,
    closeAssetWorkspace,
    openCreateAlert,
    watchlist,
    favorites,
    toggleWatchlist,
    toggleFavorite,
  } = useApp();

  const [timeframe, setTimeframe] = useState<string>("1D");
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<HistoricalPoint | null>(null);

  // Fetch chart history when asset or timeframe changes
  useEffect(() => {
    if (!selectedAsset) return;

    setIsLoadingChart(true);
    fetch(`/api/market/asset/${selectedAsset.symbol}?timeframe=${timeframe}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.history) {
          setHistory(data.history);
        }
      })
      .catch((e) => console.warn("Failed to fetch historical chart:", e))
      .finally(() => setIsLoadingChart(false));
  }, [selectedAsset, timeframe]);

  if (!selectedAsset) return null;

  const isFav = favorites.includes(selectedAsset.symbol.toUpperCase());
  const isWatch = watchlist.includes(selectedAsset.symbol.toUpperCase());

  const precision = selectedAsset.precision || 2;
  const isPositive = selectedAsset.change24hPercent >= 0;

  // Render SVG Sparkline / Interactive Price Chart
  const renderChart = () => {
    if (isLoadingChart) {
      return (
        <div className="flex h-64 w-full items-center justify-center text-xs font-mono text-slate-400">
          Loading market time-series...
        </div>
      );
    }

    if (!history || history.length < 2) {
      return (
        <div className="flex h-64 w-full items-center justify-center text-xs font-mono text-slate-500">
          Historical chart unavailable
        </div>
      );
    }

    const prices = history.map((p) => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const width = 600;
    const height = 220;

    const pointsStr = history
      .map((pt, idx) => {
        const x = (idx / (history.length - 1)) * width;
        const y = height - ((pt.price - minP) / range) * (height - 30) - 15;
        return `${x},${y}`;
      })
      .join(" ");

    const strokeColor = isPositive ? "#10b981" : "#f43f5e";
    const fillColor = isPositive ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)";

    const firstX = 0;
    const lastX = width;
    const areaPoints = `${firstX},${height} ${pointsStr} ${lastX},${height}`;

    return (
      <div className="relative w-full h-64 bg-slate-950 p-2 rounded-xl border border-slate-800/80 overflow-hidden">
        {/* Chart Header Info */}
        <div className="absolute top-3 left-4 z-10 font-mono text-xs text-slate-400">
          {hoveredPoint ? (
            <div>
              <span className="text-white font-bold">
                ${hoveredPoint.price.toLocaleString("en-US", { minimumFractionDigits: precision })}
              </span>
              <span className="ml-2 text-slate-500">
                {new Date(hoveredPoint.time * 1000).toLocaleString()}
              </span>
            </div>
          ) : (
            <div>
              <span>High: ${maxP.toFixed(precision)}</span>
              <span className="ml-4">Low: ${minP.toFixed(precision)}</span>
            </div>
          )}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <polygon points={areaPoints} fill="url(#chartGrad)" />

          {/* Line Path */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsStr}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col">
        {/* Workspace Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={selectedAsset.logo}
              alt={selectedAsset.name}
              className="h-12 w-12 rounded-full bg-slate-800 p-1 object-contain"
              onError={(e) => {
                (e.target as any).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedAsset.symbol}`;
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">
                  {selectedAsset.name}
                </h1>
                <span className="font-mono text-sm text-slate-400 font-bold">
                  ({selectedAsset.symbol})
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-mono font-bold text-slate-300">
                  Rank #{selectedAsset.rank}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Data Feed Verified</span>
                <span>•</span>
                <span className="capitalize">{selectedAsset.type} Instrument</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(selectedAsset.symbol)}
              className={`p-2 rounded-xl border transition-colors ${
                isFav
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Favorite"
            >
              <Star className={`h-5 w-5 ${isFav ? "fill-amber-400" : ""}`} />
            </button>

            <button
              onClick={() => toggleWatchlist(selectedAsset.symbol)}
              className={`p-2 rounded-xl border transition-colors ${
                isWatch
                  ? "bg-sky-500/20 border-sky-500/50 text-sky-400"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Watchlist"
            >
              <Eye className="h-5 w-5" />
            </button>

            <button
              onClick={closeAssetWorkspace}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* Price & Very Large Alert Action Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-inner">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">
                Live Market Price
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-mono text-3xl font-extrabold text-white">
                  ${selectedAsset.price.toLocaleString("en-US", { minimumFractionDigits: precision })}
                </span>
                <span
                  className={`font-mono text-sm font-bold flex items-center gap-1 ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? "+" : ""}
                  {selectedAsset.change24hPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* VERY LARGE CREATE ALERT BUTTON */}
            <button
              onClick={() => {
                closeAssetWorkspace();
                openCreateAlert(selectedAsset);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/25 transition-transform active:scale-95"
            >
              <Bell className="h-5 w-5 fill-slate-950" />
              <span>CREATE PRICE ALERT NOW</span>
            </button>
          </div>

          {/* Interactive Chart Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase">
                <BarChart2 className="h-4 w-4 text-amber-400" />
                <span>Historical Price Performance</span>
              </div>

              {/* Timeframe Selector Pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                {["1H", "4H", "1D", "1W", "1M", "1Y", "ALL"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      timeframe === tf
                        ? "bg-amber-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {renderChart()}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">24H High</div>
              <div className="font-mono text-sm font-bold text-white mt-1">
                ${selectedAsset.high24h.toLocaleString("en-US", { minimumFractionDigits: precision })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">24H Low</div>
              <div className="font-mono text-sm font-bold text-white mt-1">
                ${selectedAsset.low24h.toLocaleString("en-US", { minimumFractionDigits: precision })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">24H Volume</div>
              <div className="font-mono text-sm font-bold text-white mt-1">
                ${(selectedAsset.volume24h / 1e6).toFixed(2)}M
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">
                {selectedAsset.type === "crypto" ? "Market Cap" : "Bid / Ask Spread"}
              </div>
              <div className="font-mono text-sm font-bold text-white mt-1">
                {selectedAsset.type === "crypto"
                  ? `$${(selectedAsset.marketCap / 1e9).toFixed(2)}B`
                  : `${selectedAsset.spread || 0.0002} pts`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
