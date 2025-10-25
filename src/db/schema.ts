import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Users table - stores user data and their xu balance
 */
export const users = sqliteTable("users", {
  userId: text("user_id").primaryKey(),
  username: text("username"),
  xu: integer("xu").notNull().default(10000),
  lastLucky: integer("last_lucky"), // timestamp
  lastBox: integer("last_box"), // timestamp
  lastFish: integer("last_fish"), // timestamp
  buffActive: integer("buff_active", { mode: "boolean" }).default(false),
  buffMultiplier: real("buff_multiplier"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Fish collection table - stores user's fish inventory
 */
export const fishCollection = sqliteTable("fish_collection", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  fishType: text("fish_type").notNull(),
  count: integer("count").notNull().default(0),
});

/**
 * Gacha collection table - stores user's character collection
 */
export const gachaCollection = sqliteTable("gacha_collection", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  game: text("game").notNull(), // e.g., "blue-archive"
  characterId: text("character_id").notNull(),
  count: integer("count").notNull().default(0),
});

/**
 * Gacha banners table - stores active gacha banners
 */
export const gachaBanners = sqliteTable("gacha_banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  game: text("game").notNull(),
  characterId: integer("character_id").notNull(),
  startTime: integer("start_time").notNull(), // timestamp
  endTime: integer("end_time").notNull(), // timestamp
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type FishCollection = typeof fishCollection.$inferSelect;
export type GachaCollection = typeof gachaCollection.$inferSelect;
export type GachaBanner = typeof gachaBanners.$inferSelect;
