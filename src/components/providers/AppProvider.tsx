"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Asset } from "@/lib/market/catalog";
import { getOrCreateAnonUserId } from "@/lib/anonId";
import { playAlertSound } from "@/lib/alerts/sounds";

export type PrimaryCategory = "HOME" | "NOTES" | "ALERTS";

export interface AlertItem {
  id: string;
  anonUserId: string;
  assetSymbol: string;
  assetName: string;
  assetLogo?: string;
  assetType: "crypto" | "forex";
  condition: "ABOVE" | "BELOW" | "REACHES";
  targetPrice: number;
  initialPrice: number;
  previousPrice?: number;
  currentPrice?: number;
  soundId: string;
  soundVolume: number;
  status: "ACTIVE" | "TRIGGERED" | "DISABLED";
  internalState: string;
  triggeredAt?: string;
  lastEvaluatedAt?: string;
  triggerCount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppContextType {
  activeCategory: PrimaryCategory;
  setActiveCategory: (cat: PrimaryCategory) => void;
  anonUserId: string;
  
  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Preferences
  watchlist: string[];
  favorites: string[];
  toggleWatchlist: (symbol: string) => void;
  toggleFavorite: (symbol: string) => void;

  // Global Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Create Alert Modal State
  isCreateAlertOpen: boolean;
  alertTargetAsset: Asset | null;
  openCreateAlert: (asset: Asset) => void;
  closeCreateAlert: () => void;

  // Asset Workspace Modal State
  selectedAsset: Asset | null;
  openAssetWorkspace: (asset: Asset) => void;
  closeAssetWorkspace: () => void;

  // News Modal State
  isNewsOpen: boolean;
  setIsNewsOpen: (open: boolean) => void;

  // Alerts state
  alerts: AlertItem[];
  refreshAlerts: () => Promise<void>;
  createAlert: (data: {
    assetSymbol: string;
    condition: "ABOVE" | "BELOW" | "REACHES";
    targetPrice: number;
    soundId?: string;
    soundVolume?: number;
    note?: string;
  }) => Promise<boolean>;
  rearmAlert: (id: string) => Promise<boolean>;
  updateAlertStatus: (id: string, status: "ACTIVE" | "DISABLED") => Promise<boolean>;
  deleteAlert: (id: string) => Promise<boolean>;

  // Notification Toast State
  triggeredToast: {
    alert: AlertItem;
    message: string;
    timestamp: number;
  } | null;
  dismissToast: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<PrimaryCategory>("HOME");
  const [anonUserId, setAnonUserId] = useState<string>("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [alertTargetAsset, setAlertTargetAsset] = useState<Asset | null>(null);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isNewsOpen, setIsNewsOpen] = useState(false);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [triggeredToast, setTriggeredToast] = useState<{
    alert: AlertItem;
    message: string;
    timestamp: number;
  } | null>(null);

  // Initialize Anonymous User ID & Load Preferences
  useEffect(() => {
    const id = getOrCreateAnonUserId();
    setAnonUserId(id);

    // Request browser Notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    // Load user preferences
    fetch("/api/preferences", {
      headers: { "x-anon-user-id": id },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWatchlist(data.data.watchlist || []);
          setFavorites(data.data.favorites || []);
          if (data.data.theme) {
            setTheme(data.data.theme);
          }
        }
      })
      .catch((e) => console.warn("Failed to load preferences:", e));
  }, []);

  // Update HTML class for dark/light theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (anonUserId) {
      fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
        body: JSON.stringify({ watchlist, favorites, theme: newTheme }),
      });
    }
  };

  // Toggle Watchlist
  const toggleWatchlist = (symbol: string) => {
    const sym = symbol.toUpperCase();
    const updated = watchlist.includes(sym)
      ? watchlist.filter((s) => s !== sym)
      : [...watchlist, sym];
    setWatchlist(updated);

    if (anonUserId) {
      fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
        body: JSON.stringify({ watchlist: updated, favorites, theme }),
      });
    }
  };

  // Toggle Favorite
  const toggleFavorite = (symbol: string) => {
    const sym = symbol.toUpperCase();
    const updated = favorites.includes(sym)
      ? favorites.filter((s) => s !== sym)
      : [...favorites, sym];
    setFavorites(updated);

    if (anonUserId) {
      fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
        body: JSON.stringify({ watchlist, favorites: updated, theme }),
      });
    }
  };

  // Fetch User Alerts
  const refreshAlerts = useCallback(async () => {
    if (!anonUserId) return;
    try {
      const res = await fetch("/api/alerts", {
        headers: { "x-anon-user-id": anonUserId },
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data || []);
      }
    } catch (e) {
      console.warn("Failed to refresh alerts:", e);
    }
  }, [anonUserId]);

  useEffect(() => {
    if (anonUserId) {
      refreshAlerts();
    }
  }, [anonUserId, refreshAlerts]);

  // Background Evaluation Engine Polling (Every 8 seconds)
  useEffect(() => {
    if (!anonUserId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/alerts/evaluate", {
          method: "POST",
          headers: { "x-anon-user-id": anonUserId },
        });
        const data = await res.json();

        if (data.success && data.triggeredCount > 0) {
          // Play sound and show notification for newly triggered alerts
          for (const triggeredAlert of data.triggeredAlerts) {
            playAlertSound(triggeredAlert.soundId, triggeredAlert.soundVolume || 0.8);

            const title = `🚨 FINANCE ALERT: ${triggeredAlert.assetSymbol} ${triggeredAlert.condition} $${triggeredAlert.targetPrice}`;
            const body = `${triggeredAlert.assetName} price reached $${triggeredAlert.triggeredPrice}`;

            // Trigger Browser Notification if permitted
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(title, {
                body,
                icon: triggeredAlert.assetLogo || "/favicon.ico",
              });
            }

            // Show Toast Alert UI
            setTriggeredToast({
              alert: triggeredAlert,
              message: body,
              timestamp: Date.now(),
            });
          }

          // Refresh local alert state
          refreshAlerts();
        }
      } catch (e) {
        console.warn("Background evaluation check failed:", e);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [anonUserId, refreshAlerts]);

  // Alert Actions
  const createAlert = async (data: {
    assetSymbol: string;
    condition: "ABOVE" | "BELOW" | "REACHES";
    targetPrice: number;
    soundId?: string;
    soundVolume?: number;
    note?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        await refreshAlerts();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to create alert:", e);
      return false;
    }
  };

  const rearmAlert = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
        body: JSON.stringify({ id, action: "rearm" }),
      });
      const result = await res.json();
      if (result.success) {
        await refreshAlerts();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to rearm alert:", e);
      return false;
    }
  };

  const updateAlertStatus = async (id: string, status: "ACTIVE" | "DISABLED"): Promise<boolean> => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
        body: JSON.stringify({ id, status }),
      });
      const result = await res.json();
      if (result.success) {
        await refreshAlerts();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to update alert status:", e);
      return false;
    }
  };

  const deleteAlert = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, {
        method: "DELETE",
        headers: { "x-anon-user-id": anonUserId },
      });
      const result = await res.json();
      if (result.success) {
        await refreshAlerts();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to delete alert:", e);
      return false;
    }
  };

  // Open Create Alert Panel
  const openCreateAlert = (asset: Asset) => {
    setAlertTargetAsset(asset);
    setIsCreateAlertOpen(true);
  };

  const closeCreateAlert = () => {
    setIsCreateAlertOpen(false);
    setAlertTargetAsset(null);
  };

  // Open Asset Workspace
  const openAssetWorkspace = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const closeAssetWorkspace = () => {
    setSelectedAsset(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeCategory,
        setActiveCategory,
        anonUserId,
        theme,
        toggleTheme,
        watchlist,
        favorites,
        toggleWatchlist,
        toggleFavorite,
        isSearchOpen,
        setIsSearchOpen,
        isCreateAlertOpen,
        alertTargetAsset,
        openCreateAlert,
        closeCreateAlert,
        selectedAsset,
        openAssetWorkspace,
        closeAssetWorkspace,
        isNewsOpen,
        setIsNewsOpen,
        alerts,
        refreshAlerts,
        createAlert,
        rearmAlert,
        updateAlertStatus,
        deleteAlert,
        triggeredToast,
        dismissToast: () => setTriggeredToast(null),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
