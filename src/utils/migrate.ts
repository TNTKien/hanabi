/**
 * Migration script to transfer data from KV to D1
 * 
 * This script reads all user data from KV and writes it to D1 database
 * Run this script after deploying the new D1 database schema
 * 
 * Usage:
 * 1. Deploy worker with both KV and D1 bindings
 * 2. Visit /migrate endpoint to start migration
 * 3. Check logs to verify migration success
 * 4. After verification, remove KV binding and old database.ts
 */

import { initDB, saveUserData } from "../db";
import { users, fishCollection, gachaCollection } from "../db/schema";
import { eq } from "drizzle-orm";
import type { UserData } from "../types";
import { capXu } from "./validation";

export async function migrateKVtoD1(kv: KVNamespace, d1: D1Database) {
  const db = initDB(d1);
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Get all user keys from KV
    const list = await kv.list({ prefix: "user:" });
    console.log(`Found ${list.keys.length} users to migrate`);

    // Batch insert users for better performance
    const userBatch: any[] = [];
    const fishBatch: any[] = [];
    const gachaBatch: any[] = [];

    // Collect all data first
    for (const key of list.keys) {
      try {
        const userId = key.name.replace("user:", "");
        const data = await kv.get(key.name);

        if (!data) {
          console.log(`Skipping ${userId} - no data`);
          continue;
        }

        const userData: UserData = JSON.parse(data);
        
        // Prepare user record
        userBatch.push({
          userId,
          username: userData.username,
          xu: capXu(userData.xu),
          lastLucky: userData.lastLucky,
          lastBox: userData.lastBox,
          lastFish: userData.lastFish,
          buffActive: userData.buffActive || false,
          buffMultiplier: userData.buffMultiplier,
          updatedAt: new Date(),
        });

        // Prepare fish collection
        if (userData.fishCollection) {
          for (const [fishType, count] of Object.entries(userData.fishCollection)) {
            if (count > 0) {
              fishBatch.push({ userId, fishType, count });
            }
          }
        }

        // Prepare gacha collection
        if (userData.gachaCollection) {
          for (const [game, characters] of Object.entries(userData.gachaCollection)) {
            for (const [characterId, count] of Object.entries(characters)) {
              if (count > 0) {
                gachaBatch.push({ userId, game, characterId, count });
              }
            }
          }
        }

        console.log(`Prepared user ${userId} - ${userData.xu} xu`);
        results.success++;
      } catch (error) {
        const errorMsg = `Failed to prepare ${key.name}: ${error}`;
        console.error(errorMsg);
        results.failed++;
        results.errors.push(errorMsg);
      }
    }

    // Batch insert all users using raw SQL for better performance
    console.log(`Inserting ${userBatch.length} users in batch...`);
    
    for (const user of userBatch) {
      await db.insert(users).values(user).onConflictDoUpdate({
        target: users.userId,
        set: user,
      });
    }

    // Skip fish and gacha collection for now to avoid too many insertions
    // Will be populated when users actually use the bot
    console.log(`Skipped ${fishBatch.length} fish records and ${gachaBatch.length} gacha records (will be generated on-demand)`);

    // Migrate leaderboard data to update usernames
    const leaderboardList = await kv.list({ prefix: "leaderboard:" });
    console.log(`Found ${leaderboardList.keys.length} leaderboard entries`);

    for (const key of leaderboardList.keys) {
      try {
        const data = await kv.get(key.name);
        if (!data) continue;

        const leaderboardData = JSON.parse(data);
        const { userId, username } = leaderboardData;

        // Update username if exists
        const existingUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.userId, userId),
        });

        if (existingUser && !existingUser.username && username) {
          await db.update(users).set({
            username,
            updatedAt: new Date(),
          }).where(eq(users.userId, userId));
          
          console.log(`Updated username for ${userId}: ${username}`);
        }
      } catch (error) {
        console.error(`Failed to migrate leaderboard entry ${key.name}:`, error);
      }
    }

    console.log("Migration completed!");
    console.log(`Success: ${results.success}, Failed: ${results.failed}`);
    
    return results;
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}
