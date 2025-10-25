/**
 * Standalone migration runner
 * 
 * This script can be run using wrangler to migrate data from KV to D1
 * 
 * Usage:
 * bunx wrangler dev src/migrate-runner.ts
 * Then visit http://localhost:8787/migrate
 */

import { Hono } from "hono";
import type { Env } from "./types";
import { migrateKVtoD1 } from "./utils/migrate";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.html(`
    <html>
      <body>
        <h1>KV to D1 Migration Tool</h1>
        <p>Click the button below to start migration:</p>
        <button onclick="migrate()">Start Migration</button>
        <div id="result"></div>
        <script>
          async function migrate() {
            document.getElementById('result').innerHTML = 'Migrating...';
            try {
              const res = await fetch('/migrate');
              const data = await res.json();
              document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
              document.getElementById('result').innerHTML = 'Error: ' + error;
            }
          }
        </script>
      </body>
    </html>
  `);
});

app.get("/migrate", async (c) => {
  try {
    console.log("Starting migration...");
    const results = await migrateKVtoD1(c.env.GAME_DB, c.env.DB);
    return c.json({
      success: true,
      message: "Migration completed successfully!",
      results,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return c.json({
      success: false,
      error: String(error),
    }, 500);
  }
});

app.get("/verify", async (c) => {
  try {
    const db = c.env.DB;
    
    // Count users
    const countResult = await db.prepare("SELECT COUNT(*) as total FROM users").all();
    
    // Get top 10 users
    const topUsers = await db.prepare(
      "SELECT user_id, username, xu FROM users ORDER BY xu DESC LIMIT 10"
    ).all();
    
    // Get test data
    const testData = await db.prepare(
      "SELECT user_id, username, xu FROM users WHERE user_id IN ('123456789', '987654321', '555555555', '111111111', '222222222')"
    ).all();
    
    return c.json({
      success: true,
      totalUsers: countResult.results[0],
      topUsers: topUsers.results,
      testData: testData.results,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error),
    }, 500);
  }
});

export default app;
