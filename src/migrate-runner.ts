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
    
    // Check if KV has data
    const kvList = await c.env.GAME_DB.list({ limit: 1 });
    console.log(`KV contains ${kvList.keys.length > 0 ? 'data' : 'no data'}`);
    
    if (kvList.keys.length === 0) {
      return c.json({
        success: false,
        error: "KV namespace is empty. Make sure you're running against the correct environment with data.",
        hint: "Local KV is empty by default. You may need to migrate from production or populate local KV first.",
      }, 400);
    }
    
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

export default app;
