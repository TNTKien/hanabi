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
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { UserData } from "../types";

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

    // Migrate each user
    for (const key of list.keys) {
      try {
        const userId = key.name.replace("user:", "");
        const data = await kv.get(key.name);

        if (!data) {
          console.log(`Skipping ${userId} - no data`);
          continue;
        }

        const userData: UserData = JSON.parse(data);
        
        // Save to D1
        await saveUserData(userId, userData, db);
        
        console.log(`Migrated user ${userId} - ${userData.xu} xu`);
        results.success++;
      } catch (error) {
        const errorMsg = `Failed to migrate ${key.name}: ${error}`;
        console.error(errorMsg);
        results.failed++;
        results.errors.push(errorMsg);
      }
    }

    // Also migrate leaderboard data to ensure usernames are preserved
    const leaderboardList = await kv.list({ prefix: "leaderboard:" });
    console.log(`Found ${leaderboardList.keys.length} leaderboard entries`);

    for (const key of leaderboardList.keys) {
      try {
        const data = await kv.get(key.name);
        if (!data) continue;

        const leaderboardData = JSON.parse(data);
        const { userId, username, xu } = leaderboardData;

        // Update username in D1 if not already set
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
