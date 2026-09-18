"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { NewsItem } from "@/lib/market/providers";
import { X, Newspaper, ExternalLink, Globe, Tag } from "lucide-react";

export function NewsModal() {
  const { isNewsOpen, setIsNewsOpen, openCreateAlert } = useApp();
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isNewsOpen) {
      setIsLoading(true);
      fetch("/api/market/news")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setArticles(data.data);
          }
        })
        .catch((e) => console.warn("News fetch error:", e))
        .finally(() => setIsLoading(false));
    }
  }, [isNewsOpen]);

  if (!isNewsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                MARKET NEWS & INTELLIGENCE
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-500/30">
                  REAL FEEDS
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Latest Verified Crypto & Forex Market Headlines
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNewsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-mono text-slate-400 animate-pulse">
              Fetching financial news feeds...
            </div>
          ) : (
            articles.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-amber-400">{item.source}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-mono">
                        {new Date(item.publishedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.symbol && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] font-bold border border-slate-700">
                          {item.symbol}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.excerpt}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-amber-400 hover:underline font-semibold"
                  >
                    <span>Read Original Source</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
