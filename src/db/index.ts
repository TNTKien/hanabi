import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import * as schema from "./schema";
import type { UserData } from "../types";
import { capXu } from "../utils/validation";

/**
 * Initialize Drizzle ORM with D1 database
 */
export function initDB(d1: D1Database) {
  return drizzle(d1, { schema });
}

/**
 * Get user data from D1 database
 */
export async function getUserData(
  userId: string,
  db: ReturnType<typeof initDB>
): Promise<UserData> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.userId, userId),
  });

  if (!user) {
    // Return default user data
    return { xu: 10000 };
  }

  // Get fish collection
  const fishRows = await db.query.fishCollection.findMany({
    where: eq(schema.fishCollection.userId, userId),
  });

  const fishCollection: Record<string, number> = {};
  fishRows.forEach((row) => {
    fishCollection[row.fishType] = row.count;
  });

  // Get gacha collection
  const gachaRows = await db.query.gachaCollection.findMany({
    where: eq(schema.gachaCollection.userId, userId),
  });

  const gachaCollection: Record<string, Record<string, number>> = {};
  gachaRows.forEach((row) => {
    if (!gachaCollection[row.game]) {
      gachaCollection[row.game] = {};
    }
    gachaCollection[row.game][row.characterId] = row.count;
  });

  return {
    xu: user.xu,
    username: user.username || undefined,
    lastLucky: user.lastLucky || undefined,
    lastBox: user.lastBox || undefined,
    lastFish: user.lastFish || undefined,
    buffActive: user.buffActive || false,
    buffMultiplier: user.buffMultiplier || undefined,
    fishCollection: Object.keys(fishCollection).length > 0 ? fishCollection : undefined,
    gachaCollection: Object.keys(gachaCollection).length > 0 ? gachaCollection : undefined,
  };
}

/**
 * Save user data to D1 database
 */
export async function saveUserData(
  userId: string,
  data: UserData,
  db: ReturnType<typeof initDB>
) {
  // Cap xu at maximum before saving
  data.xu = capXu(data.xu);

  // Upsert user data
  await db
    .insert(schema.users)
    .values({
      userId,
      username: data.username,
      xu: data.xu,
      lastLucky: data.lastLucky,
      lastBox: data.lastBox,
      lastFish: data.lastFish,
      buffActive: data.buffActive,
      buffMultiplier: data.buffMultiplier,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.users.userId,
      set: {
        username: data.username,
        xu: data.xu,
        lastLucky: data.lastLucky,
        lastBox: data.lastBox,
        lastFish: data.lastFish,
        buffActive: data.buffActive,
        buffMultiplier: data.buffMultiplier,
        updatedAt: new Date(),
      },
    });

  // Update fish collection if exists
  if (data.fishCollection) {
    for (const [fishType, count] of Object.entries(data.fishCollection)) {
      // Delete existing record
      await db
        .delete(schema.fishCollection)
        .where(
          eq(schema.fishCollection.userId, userId) &&
            eq(schema.fishCollection.fishType, fishType)
        );

      // Insert new record
      if (count > 0) {
        await db.insert(schema.fishCollection).values({
          userId,
          fishType,
          count,
        });
      }
    }
  }

  // Update gacha collection if exists
  if (data.gachaCollection) {
    for (const [game, characters] of Object.entries(data.gachaCollection)) {
      for (const [characterId, count] of Object.entries(characters)) {
        // Delete existing record
        await db
          .delete(schema.gachaCollection)
          .where(
            eq(schema.gachaCollection.userId, userId) &&
              eq(schema.gachaCollection.game, game) &&
              eq(schema.gachaCollection.characterId, characterId)
          );

        // Insert new record
        if (count > 0) {
          await db.insert(schema.gachaCollection).values({
            userId,
            game,
            characterId,
            count,
          });
        }
      }
    }
  }
}

/**
 * Update leaderboard (just update username in users table)
 */
export async function updateLeaderboard(
  userId: string,
  username: string,
  xu: number,
  db: ReturnType<typeof initDB>
) {
  // Cap xu at maximum
  const cappedXu = capXu(xu);

  await db
    .insert(schema.users)
    .values({
      userId,
      username,
      xu: cappedXu,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.users.userId,
      set: {
        username,
        xu: cappedXu,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get top users from leaderboard
 */
export async function getTopUsers(
  db: ReturnType<typeof initDB>,
  limit: number = 10
): Promise<Array<{ username: string; xu: number; userId: string }>> {
  const users = await db.query.users.findMany({
    orderBy: [desc(schema.users.xu)],
    limit,
  });

  return users.map((user) => ({
    username: user.username || "Unknown",
    xu: user.xu,
    userId: user.userId,
  }));
}

/**
 * Transfer xu to house account
 */
export async function transferToHouse(
  amount: number,
  db: ReturnType<typeof initDB>,
  houseUserId: string
) {
  const houseData = await getUserData(houseUserId, db);
  houseData.xu += amount;
  await saveUserData(houseUserId, houseData, db);
}

/**
 * Roll dice (utility function, kept for compatibility)
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}
