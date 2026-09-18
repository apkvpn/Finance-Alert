import { pgTable, text, timestamp, doublePrecision, integer, boolean } from "drizzle-orm/pg-core";

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  anonUserId: text("anon_user_id").notNull(),
  assetSymbol: text("asset_symbol").notNull(),
  assetName: text("asset_name").notNull(),
  assetLogo: text("asset_logo"),
  assetType: text("asset_type").notNull().default("crypto"), // 'crypto' | 'forex'
  condition: text("condition").notNull(), // 'ABOVE' | 'BELOW' | 'REACHES'
  targetPrice: doublePrecision("target_price").notNull(),
  initialPrice: doublePrecision("initial_price").notNull(),
  previousPrice: doublePrecision("previous_price"),
  currentPrice: doublePrecision("current_price"),
  soundId: text("sound_id").notNull().default("classic_bell"),
  soundVolume: doublePrecision("sound_volume").notNull().default(0.8),
  status: text("status").notNull().default("ACTIVE"), // 'ACTIVE' | 'TRIGGERED' | 'DISABLED'
  internalState: text("internal_state").notNull().default("EVALUATING"), // 'EVALUATING' | 'PENDING' | 'NOTIFICATION_DELIVERED' | 'ERROR'
  triggeredAt: timestamp("triggered_at"),
  lastEvaluatedAt: timestamp("last_evaluated_at"),
  triggerCount: integer("trigger_count").notNull().default(0),
  idempotencyKey: text("idempotency_key"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const alertHistory = pgTable("alert_history", {
  id: text("id").primaryKey(),
  alertId: text("alert_id").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  anonUserId: text("anon_user_id").notNull(),
  triggerPrice: doublePrecision("trigger_price").notNull(),
  targetPrice: doublePrecision("target_price").notNull(),
  condition: text("condition").notNull(),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  message: text("message"),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  anonUserId: text("anon_user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  relatedSymbol: text("related_symbol"),
  relatedAlertId: text("related_alert_id"),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  anonUserId: text("anon_user_id").primaryKey(),
  watchlist: text("watchlist").notNull().default("[]"), // JSON string array of symbols
  favorites: text("favorites").notNull().default("[]"), // JSON string array of symbols
  theme: text("theme").notNull().default("dark"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customSounds = pgTable("custom_sounds", {
  id: text("id").primaryKey(),
  anonUserId: text("anon_user_id").notNull(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  audioData: text("audio_data").notNull(), // base64 data url
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
