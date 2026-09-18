"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { calculateAlertDistance } from "@/lib/alerts/engine";
import { BUILTIN_SOUNDS, playAlertSound, SoundOption } from "@/lib/alerts/sounds";
import {
  X,
  Bell,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Play,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function CreateAlertModal() {
  const { isCreateAlertOpen, closeCreateAlert, alertTargetAsset, createAlert } = useApp();

  const [condition, setCondition] = useState<"ABOVE" | "BELOW" | "REACHES">("ABOVE");
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [targetString, setTargetString] = useState<string>("");
  const [soundId, setSoundId] = useState<string>("classic_bell");
  const [soundVolume, setSoundVolume] = useState<number>(0.8);
  const [note, setNote] = useState<string>("");

  const [livePrice, setLivePrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSounds, setAvailableSounds] = useState<SoundOption[]>(BUILTIN_SOUNDS);

  // Sync live price when modal opens
  useEffect(() => {
    if (alertTargetAsset) {
      const p = alertTargetAsset.price || 100;
      setLivePrice(p);
      const defaultTarget = Math.round(p * 1.02 * 100000000) / 100000000;
      setTargetPrice(defaultTarget);
      setTargetString(defaultTarget.toString());
      setCondition("ABOVE");
    }
  }, [alertTargetAsset]);

  // Load custom sounds if available
  useEffect(() => {
    fetch("/api/sounds")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAvailableSounds(data.data);
        }
      })
      .catch(() => {});
  }, [isCreateAlertOpen]);

  // Continuously refresh live price while modal is open
  useEffect(() => {
    if (!isCreateAlertOpen || !alertTargetAsset) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/market/asset/${alertTargetAsset.symbol}`);
        const data = await res.json();
        if (data.success && data.asset?.price) {
          setLivePrice(data.asset.price);
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [isCreateAlertOpen, alertTargetAsset]);

  if (!isCreateAlertOpen || !alertTargetAsset) return null;

  const precision = alertTargetAsset.precision || 2;

  // Format helper based on dynamic asset precision
  const formatPrice = (val: number) => {
    if (isNaN(val)) return "0.00";
    return val.toLocaleString("en-US", {
      minimumFractionDigits: Math.min(precision, 2),
      maximumFractionDigits: precision,
    });
  };

  // Distance metrics calculation
  const metrics = calculateAlertDistance(livePrice, targetPrice);

  // Percentage Quick Adjustments
  const handlePercentageShortcut = (pct: number) => {
    const newT = Math.max(0.00000001, livePrice * (1 + pct / 100));
    const rounded = Number(newT.toFixed(precision));
    setTargetPrice(rounded);
    setTargetString(rounded.toString());
    if (pct > 0) setCondition("ABOVE");
    if (pct < 0) setCondition("BELOW");
  };

  // Step Increment / Decrement
  const handleStep = (direction: 1 | -1) => {
    const step = Math.pow(10, -precision) * 10;
    const newT = Math.max(0.00000001, targetPrice + direction * step);
    const rounded = Number(newT.toFixed(precision));
    setTargetPrice(rounded);
    setTargetString(rounded.toString());
  };

  // Handle Input change
  const handleInputChange = (val: string) => {
    setTargetString(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setTargetPrice(parsed);
      if (parsed > livePrice) setCondition("ABOVE");
      else if (parsed < livePrice) setCondition("BELOW");
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleStep(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleStep(-1);
    }
  };

  // Submit Alert
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) return;

    setIsSubmitting(true);
    const success = await createAlert({
      assetSymbol: alertTargetAsset.symbol,
      condition,
      targetPrice,
      soundId,
      soundVolume,
      note,
    });

    setIsSubmitting(false);
    if (success) {
      closeCreateAlert();
    }
  };

  // Test sound play
  const handleTestSound = () => {
    const custom = availableSounds.find((s) => s.id === soundId);
    playAlertSound(soundId, soundVolume, (custom as any)?.audioData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                SET ADVANCED ALERT
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-500/30">
                  REAL-TIME
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Monitored by Finance Alert Engine 24/7
              </p>
            </div>
          </div>

          <button
            onClick={closeCreateAlert}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Asset Live Info Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <img
                src={alertTargetAsset.logo}
                alt={alertTargetAsset.name}
                className="h-10 w-10 rounded-full bg-slate-800 p-0.5 object-contain"
                onError={(e) => {
                  (e.target as any).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${alertTargetAsset.symbol}`;
                }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base">
                    {alertTargetAsset.symbol}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[120px]">
                    {alertTargetAsset.name}
                  </span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {alertTargetAsset.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live Verification</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Current Price</div>
              <div className="font-mono text-lg font-bold text-white">
                ${formatPrice(livePrice)}
              </div>
            </div>
          </div>

          {/* Condition Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. Select Trigger Condition
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCondition("ABOVE")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  condition === "ABOVE"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <TrendingUp className="h-4 w-4 mb-1" />
                <span>CROSSES ABOVE</span>
                <span className="text-[10px] opacity-75 font-normal">Target Price</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition("BELOW")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  condition === "BELOW"
                    ? "bg-rose-500/10 border-rose-500 text-rose-400 shadow-md shadow-rose-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <TrendingDown className="h-4 w-4 mb-1" />
                <span>CROSSES BELOW</span>
                <span className="text-[10px] opacity-75 font-normal">Target Price</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition("REACHES")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  condition === "REACHES"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Zap className="h-4 w-4 mb-1" />
                <span>REACHES ZONE</span>
                <span className="text-[10px] opacity-75 font-normal">Target Threshold</span>
              </button>
            </div>
          </div>

          {/* Interactive Target Price Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Set Target Price ($)
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Use Keyboard Up/Down or Wheel
              </span>
            </div>

            {/* Target Price Numeric Input with Step Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>

              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg font-bold text-amber-400">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  value={targetString}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-9 pr-4 text-center font-mono text-xl font-extrabold text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                  placeholder="0.00"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStep(1)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Percentage Shortcuts */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {[-5, -2, -1, -0.5, 0.5, 1, 2, 5].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentageShortcut(pct)}
                  className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                    pct > 0
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  }`}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>

            {/* Slider Control */}
            <div className="space-y-1 pt-1">
              <input
                type="range"
                min={livePrice * 0.5}
                max={livePrice * 1.5}
                step={Math.pow(10, -precision)}
                value={targetPrice}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTargetPrice(val);
                  setTargetString(val.toString());
                }}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-slate-800"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Min: ${formatPrice(livePrice * 0.5)}</span>
                <span>Current: ${formatPrice(livePrice)}</span>
                <span>Max: ${formatPrice(livePrice * 1.5)}</span>
              </div>
            </div>

            {/* Live Calculation Display Panel */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-medium block">
                  Price Gap Distance
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  ${formatPrice(metrics.distanceAbs)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 font-medium block">
                  Relative Shift (%)
                </span>
                <span
                  className={`font-mono text-sm font-bold flex items-center gap-1 ${
                    metrics.direction === "UP"
                      ? "text-emerald-400"
                      : metrics.direction === "DOWN"
                      ? "text-rose-400"
                      : "text-slate-300"
                  }`}
                >
                  {metrics.direction === "UP" ? "+" : metrics.direction === "DOWN" ? "-" : ""}
                  {Math.abs(metrics.distancePercent)}%
                  {metrics.direction === "UP" ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : metrics.direction === "DOWN" ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : null}
                </span>
              </div>
            </div>
          </div>

          {/* Sound & Notification Config */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Sound Signal & Volume
            </label>

            <div className="flex items-center gap-3">
              <select
                value={soundId}
                onChange={(e) => setSoundId(e.target.value)}
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
              >
                {availableSounds.map((snd) => (
                  <option key={snd.id} value={snd.id}>
                    {snd.name} ({snd.category})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleTestSound}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-amber-400" />
                <span>Test</span>
              </button>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="font-mono text-xs text-slate-400 min-w-[35px] text-right">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              4. Note / Context (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Take profit level, Breakout entry, Support test..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !targetPrice}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Bell className="h-4 w-4 fill-slate-950" />
              <span>{isSubmitting ? "ACTIVATING ALERT..." : "CREATE ALERT NOW"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
