"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/providers/AppProvider";
import {
  FileText,
  Pin,
  Plus,
  Trash2,
  Edit3,
  Search,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Check,
  X,
  Bell,
  Sparkles,
} from "lucide-react";

interface Note {
  id: string;
  anonUserId: string;
  title: string;
  content: string;
  relatedSymbol?: string | null;
  relatedAlertId?: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function NotesWorkspace() {
  const { anonUserId, alerts } = useApp();

  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedSymbol, setRelatedSymbol] = useState("");
  const [relatedAlertId, setRelatedAlertId] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  // Fetch Notes
  const fetchNotes = async () => {
    if (!anonUserId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/notes", {
        headers: { "x-anon-user-id": anonUserId },
      });
      const data = await res.json();
      if (data.success) {
        setNotes(data.data || []);
      }
    } catch (e) {
      console.warn("Failed to load notes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [anonUserId]);

  // Open Editor for Create or Edit
  const handleOpenEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
      setRelatedSymbol(note.relatedSymbol || "");
      setRelatedAlertId(note.relatedAlertId || "");
      setIsPinned(note.isPinned);
    } else {
      setEditingNote(null);
      setTitle("");
      setContent("");
      setRelatedSymbol("");
      setRelatedAlertId("");
      setIsPinned(false);
    }
    setIsEditorOpen(true);
  };

  // Save Note
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const payload = {
        id: editingNote?.id,
        title,
        content,
        relatedSymbol,
        relatedAlertId,
        isPinned,
      };

      const method = editingNote ? "PUT" : "POST";
      const res = await fetch("/api/notes", {
        method,
        headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditorOpen(false);
        fetchNotes();
      }
    } catch (e) {
      console.error("Save note failed:", e);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (note: Note) => {
    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-anon-user-id": anonUserId },
        body: JSON.stringify({ id: note.id, isPinned: !note.isPinned }),
      });
      fetchNotes();
    } catch (e) {
      console.error("Pin note failed:", e);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`/api/notes?id=${id}`, {
        method: "DELETE",
        headers: { "x-anon-user-id": anonUserId },
      });
      fetchNotes();
    } catch (e) {
      console.error("Delete note failed:", e);
    }
  };

  // Formatting helpers
  const applyFormat = (tag: string) => {
    if (tag === "bold") setContent((prev) => `${prev} **bold text**`);
    if (tag === "italic") setContent((prev) => `${prev} *italic text*`);
    if (tag === "ul") setContent((prev) => `${prev}\n- List item`);
    if (tag === "ol") setContent((prev) => `${prev}\n1. List item`);
  };

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.relatedSymbol?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
              <FileText className="h-4 w-4" />
              <span>SECOND PRIMARY CATEGORY</span>
            </div>
            <h1 className="text-2xl font-black text-white">Financial Trading Notes</h1>
            <p className="text-xs text-slate-400 mt-1">
              Organize market theses, target strategy journals, and link notes directly to your active alerts.
            </p>
          </div>

          <button
            onClick={() => handleOpenEditor()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>CREATE NOTE</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 p-2 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, symbols, or content..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2 pl-10 pr-4 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        <span className="text-xs font-mono text-slate-400 px-3">
          {filteredNotes.length} Note{filteredNotes.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-400 animate-pulse">
          Loading notes...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <FileText className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Notes Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create trade notes or link them to active alerts to document your financial strategies.
          </p>
          <button
            onClick={() => handleOpenEditor()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-950 border transition-all shadow-lg ${
                note.isPinned
                  ? "border-amber-500/50 bg-slate-950/90 shadow-amber-500/5"
                  : "border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div className="space-y-3">
                {/* Note Top Bar */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-white text-base leading-snug line-clamp-2">
                    {note.title}
                  </h3>

                  <button
                    onClick={() => handleTogglePin(note)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      note.isPinned
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                    title={note.isPinned ? "Unpin Note" : "Pin Note"}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Related Asset Badge */}
                {note.relatedSymbol && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
                    <Link className="h-3 w-3" />
                    <span>{note.relatedSymbol}</span>
                  </div>
                )}

                {/* Note Content */}
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-6">
                  {note.content}
                </p>
              </div>

              {/* Note Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditor(note)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition-colors"
                    title="Edit Note"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 font-sans text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <span>{editingNote ? "EDIT NOTE" : "CREATE NEW NOTE"}</span>
              </h2>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => applyFormat("bold")}
                  className="p-1.5 rounded bg-slate-900 text-slate-300 hover:text-white font-bold"
                  title="Bold"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat("italic")}
                  className="p-1.5 rounded bg-slate-900 text-slate-300 hover:text-white"
                  title="Italic"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat("ul")}
                  className="p-1.5 rounded bg-slate-900 text-slate-300 hover:text-white"
                  title="Bullet List"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat("ol")}
                  className="p-1.5 rounded bg-slate-900 text-slate-300 hover:text-white"
                  title="Numbered List"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Content</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write market strategy notes or analysis..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Related Symbol
                  </label>
                  <input
                    type="text"
                    value={relatedSymbol}
                    onChange={(e) => setRelatedSymbol(e.target.value)}
                    placeholder="e.g. BTC, EUR/USD"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-950 border border-slate-800 w-full text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="accent-amber-500 h-4 w-4 rounded"
                    />
                    <span>Pin to Top</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-md shadow-amber-500/20"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
