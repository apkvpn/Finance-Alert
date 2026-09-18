"use client";

import React from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Bell, X, ArrowRight, Zap } from "lucide-react";

export function TriggeredToast() {
  const { triggeredToast, dismissToast, setActiveCategory } = useApp();

  if (!triggeredToast) return null;

  const { alert, message } = triggeredToast;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/30 text-white font-sans animate-bounce-short">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
            <Bell className="h-5 w-5 fill-slate-950 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-400 text-sm">
                ALERT TRIGGERED!
              </span>
              <span className="font-mono text-xs text-white font-extrabold">
                {alert.assetSymbol}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {message}
            </p>
          </div>
        </div>

        <button
          onClick={dismissToast}
          className="p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-xs font-mono">
        <span className="text-slate-400">Target: ${alert.targetPrice}</span>

        <button
          onClick={() => {
            dismissToast();
            setActiveCategory("ALERTS");
          }}
          className="flex items-center gap-1 text-amber-400 font-bold hover:underline"
        >
          <span>View in Alert Center</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
