export function getOrCreateAnonUserId(): string {
  if (typeof window === "undefined") return "server_default_anon";

  const STORAGE_KEY = "finance_alert_anon_id";
  let anonId = localStorage.getItem(STORAGE_KEY);

  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, anonId);
  }

  // Also set cookie so API route handlers can read it
  document.cookie = `${STORAGE_KEY}=${anonId}; path=/; max-age=31536000; SameSite=Strict`;

  return anonId;
}
