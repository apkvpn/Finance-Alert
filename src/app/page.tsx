"use client";

import React from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Header } from "@/components/layout/Header";
import { HomeWorkspace } from "@/components/views/HomeWorkspace";
import { NotesWorkspace } from "@/components/views/NotesWorkspace";
import { AlertsWorkspace } from "@/components/views/AlertsWorkspace";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { AssetWorkspaceModal } from "@/components/workspace/AssetWorkspaceModal";
import { NewsModal } from "@/components/news/NewsModal";
import { TriggeredToast } from "@/components/alerts/TriggeredToast";
import { StickyMobileAlertButton } from "@/components/alerts/StickyMobileAlertButton";

export default function MainPage() {
  const { activeCategory } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Global Header */}
      <Header />

      {/* Main Category Workspace Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {activeCategory === "HOME" && <HomeWorkspace />}
        {activeCategory === "NOTES" && <NotesWorkspace />}
        {activeCategory === "ALERTS" && <AlertsWorkspace />}
      </main>

      {/* Global Interactive Modals & Toast */}
      <CreateAlertModal />
      <GlobalSearchModal />
      <AssetWorkspaceModal />
      <NewsModal />
      <TriggeredToast />
      <StickyMobileAlertButton />
    </div>
  );
}
