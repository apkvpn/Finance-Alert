"use client";

import React, { useState, useEffect } from "react";
import { useApp, AlertItem } from "@/components/providers/AppProvider";
import { calculateAlertDistance } from "@/lib/alerts/engine";
import { BUILTIN_SOUNDS, playAlertSound, validateCustomAudioFile, SoundOption } from "@/lib/alerts/sounds";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit3,
  Power,
  Volume2,
  Play,
  Upload,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  ShieldCheck,
} from "lucide-react";

export function AlertsWorkspace() {
  const {
    alerts,
    anonUserId,
    refreshAlerts,
    rearmAlert,
    updateAlertStatus,
    deleteAlert,
    openCreateAlert,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "TRIGGERED" | "DISABLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableSounds, setAvailableSounds] = useState<SoundOption[]>(BUILTIN_SOUNDS);

  // Custom Audio Upload State
  const [customSoundName, setCustomSoundName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch Sound Library
  const fetchSounds = async () => {
    try {
      const res = await fetch("/api/sounds", {
        headers: { "x-anon-user-id": anonUserId },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAvailableSounds(data.data);
      }
    } catch (e) {
      console.warn("Failed to load sounds:", e);
    }
  };

  useEffect(() => {
    if (anonUserId) {
      fetchSounds();
    }
  }, [anonUserId]);

  // Handle Custom Audio Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !customSoundName.trim()) return;

    setUploadError("");
    const val = validateCustomAudioFile(selectedFile);
    if (!val.valid) {
      setUploadError(val.error || "Invalid file");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        const res = await fetch("/api/sounds", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
          body: JSON.stringify({
            name: customSoundName.trim(),
            mimeType: selectedFile.type || "audio/mp3",
            audioData: base64Data,
            sizeBytes: selectedFile.size,
          }),
        });

        const data = await res.json();
        setIsUploading(false);
        if (data.success) {
          setCustomSoundName("");
          setSelectedFile(null);
          fetchSounds();
        } else {
          setUploadError(data.error || "Upload failed");
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setIsUploading(false);
      setUploadError("Audio upload failed");
    }
  };

  // Delete Custom Sound
  const handleDeleteCustomSound = async (soundId: string) => {
    try {
      await fetch(`/api/sounds?id=${soundId}`, {
        method: "DELETE",
        headers: { "x-anon-user-id": anonUserId },
      });
      fetchSounds();
    } catch (e) {
      console.warn("Failed to delete sound:", e);
    }
  };

  // Statistics Counters
  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;
  const triggeredCount = alerts.filter((a) => a.status === "TRIGGERED").length;
  const disabledCount = alerts.filter((a) => a.status === "DISABLED").length;

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.assetSymbol.toLowerCase().includes(q) ||
        a.assetName.toLowerCase().includes(q) ||
        a.note?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-20 font-sans">
      {/* Central Command Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-extrabold text-amber-300">
              <Zap className="h-3.5 w-3.5 fill-amber-300" />
              <span>THIRD MAIN CATEGORY — CENTRAL COMMAND CENTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Advanced Market Alert Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Monitored around the clock with price transition state tracking, Web Audio API synthesis, idempotency keys, and instant browser notifications.
            </p>
          </div>

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
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/30 transition-transform active:scale-95 shrink-0"
          >
            <Bell className="h-5 w-5 fill-slate-950" />
            <span>CREATE ALERT NOW</span>
          </button>
        </div>

        {/* Statistics Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Active Alerts</div>
            <div className="font-mono text-2xl font-black text-amber-400 mt-0.5">{activeCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Triggered Alerts</div>
            <div className="font-mono text-2xl font-black text-emerald-400 mt-0.5">{triggeredCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Disabled Alerts</div>
            <div className="font-mono text-2xl font-black text-slate-500 mt-0.5">{disabledCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Engine Status</div>
            <div className="font-mono text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>24/7 ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1">
          {[
            { id: "ALL", label: `ALL ALERTS (${alerts.length})` },
            { id: "ACTIVE", label: `ACTIVE (${activeCount})` },
            { id: "TRIGGERED", label: `TRIGGERED (${triggeredCount})` },
            { id: "DISABLED", label: `DISABLED (${disabledCount})` },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                statusFilter === filter.id
                  ? "bg-slate-900 text-amber-400 border border-amber-500/30 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 px-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by symbol..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 py-1.5 pl-9 pr-3 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Alert List Cards */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <Bell className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Alerts Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create an alert for any cryptocurrency or forex instrument to start tracking price targets.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const currentP = alert.currentPrice || alert.initialPrice;
            const metrics = calculateAlertDistance(currentP, alert.targetPrice);

            return (
              <div
                key={alert.id}
                className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950 border transition-all shadow-xl ${
                  alert.status === "TRIGGERED"
                    ? "border-emerald-500/50 bg-emerald-950/10 shadow-emerald-500/5"
                    : alert.status === "ACTIVE"
                    ? "border-slate-800 hover:border-amber-500/40"
                    : "border-slate-900 opacity-60"
                }`}
              >
                {/* Left: Asset info & state tag */}
                <div className="flex items-center gap-4">
                  <img
                    src={alert.assetLogo || ""}
                    alt={alert.assetName}
                    className="h-10 w-10 rounded-full bg-slate-900 p-1 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as any).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${alert.assetSymbol}`;
                    }}
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base font-mono">
                        {alert.assetSymbol}
                      </span>
                      <span className="text-xs text-slate-400 truncate max-w-[120px]">
                        {alert.assetName}
                      </span>

                      {/* Condition Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase border ${
                          alert.condition === "ABOVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : alert.condition === "BELOW"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {alert.condition}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                          alert.status === "ACTIVE"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : alert.status === "TRIGGERED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-3">
                      <span>Sound: {alert.soundId}</span>
                      <span>•</span>
                      <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Prices & Live Distance */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Current Price</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      ${currentP.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Target Price</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5">
                      ${alert.targetPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Target Distance</div>
                    <div
                      className={`text-sm font-bold flex items-center gap-1 mt-0.5 ${
                        metrics.direction === "UP"
                          ? "text-emerald-400"
                          : metrics.direction === "DOWN"
                          ? "text-rose-400"
                          : "text-slate-300"
                      }`}
                    >
                      ${metrics.distanceAbs.toFixed(2)} ({metrics.distancePercent}%)
                    </div>
                  </div>
                </div>

                {/* Right: Actions (Re-arm, Enable/Disable, Test Sound, Delete) */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-0 border-slate-900">
                  {/* RE-ARM BUTTON for Triggered Alerts */}
                  {alert.status === "TRIGGERED" && (
                    <button
                      onClick={() => rearmAlert(alert.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-extrabold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-transform active:scale-95"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>RE-ARM ALERT</span>
                    </button>
                  )}

                  {/* Enable / Disable Toggle */}
                  <button
                    onClick={() =>
                      updateAlertStatus(
                        alert.id,
                        alert.status === "DISABLED" ? "ACTIVE" : "DISABLED"
                      )
                    }
                    className={`p-2 rounded-xl border transition-colors ${
                      alert.status === "DISABLED"
                        ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-white"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    }`}
                    title={alert.status === "DISABLED" ? "Enable Alert" : "Disable Alert"}
                  >
                    <Power className="h-4 w-4" />
                  </button>

                  {/* Test Sound */}
                  <button
                    onClick={() => {
                      const cust = availableSounds.find((s) => s.id === alert.soundId);
                      playAlertSound(alert.soundId, alert.soundVolume, (cust as any)?.audioData);
                    }}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                    title="Test Alert Sound"
                  >
                    <Play className="h-4 w-4" />
                  </button>

                  {/* Delete Alert */}
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Alert"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOM SOUND LIBRARY & AUDIO UPLOADER */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">ALERT SOUND SIGNAL LIBRARY</h2>
            <p className="text-xs text-slate-400 font-medium">
              Choose from 10 synthesized audio presets or upload custom audio files (MP3/WAV, max 5MB).
            </p>
          </div>
        </div>

        {/* Custom Audio Upload Form */}
        <form onSubmit={handleFileUpload} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="text-xs font-extrabold text-white uppercase tracking-wider">
            Upload Custom Audio Sound
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={customSoundName}
              onChange={(e) => setCustomSoundName(e.target.value)}
              placeholder="Sound Name (e.g. Horn 1)..."
              className="rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
            />

            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="rounded-xl bg-slate-950 border border-slate-800 py-1.5 px-3 text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500/20 file:text-amber-400"
            />

            <button
              type="submit"
              disabled={isUploading || !selectedFile || !customSoundName}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-extrabold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{isUploading ? "Uploading..." : "Upload Sound"}</span>
            </button>
          </div>

          {uploadError && <p className="text-xs font-semibold text-rose-400">{uploadError}</p>}
        </form>

        {/* Sound Presets List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {availableSounds.map((snd) => (
            <div
              key={snd.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-colors"
            >
              <div className="truncate">
                <div className="font-extrabold text-white text-xs truncate">{snd.name}</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">{snd.category}</div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => playAlertSound(snd.id, 0.8, (snd as any)?.audioData)}
                  className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  title="Preview Sound"
                >
                  <Play className="h-3.5 w-3.5 fill-amber-400" />
                </button>

                {snd.category === "custom" && (
                  <button
                    onClick={() => handleDeleteCustomSound(snd.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    title="Delete Custom Sound"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
