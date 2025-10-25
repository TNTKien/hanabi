/**
 * Simple script to populate test data in KV using wrangler CLI
 * Run: bun run scripts/populate-kv.ts
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const testUsers = [
  {
    userId: "123456789",
    data: {
      xu: 50000,
      username: "TestUser1",
      lastLucky: Date.now() - 86400000,
    },
  },
  {
    userId: "987654321",
    data: {
      xu: 100000,
      username: "TestUser2",
      lastLucky: Date.now() - 172800000,
    },
  },
  {
    userId: "555555555",
    data: {
      xu: 25000,
      username: "TestUser3",
    },
  },
  {
    userId: "111111111",
    data: {
      xu: 500000,
      username: "RichUser",
      lastLucky: Date.now(),
    },
  },
  {
    userId: "222222222",
    data: {
      xu: 15000,
      username: "NewUser",
    },
  },
];

const KV_NAMESPACE_ID = "4779470a237a4d84b96c245bf7742173";

async function populateKV() {
  console.log("🚀 Populating KV with test data...\n");

  // Create user data
  for (const user of testUsers) {
    const key = `user:${user.userId}`;
    const value = JSON.stringify(user.data);
    
    try {
      const cmd = `bunx wrangler kv key put --namespace-id=${KV_NAMESPACE_ID} "${key}" "${value.replace(/"/g, '\\"')}"`;
      await execAsync(cmd);
      console.log(`✅ Created user:${user.userId} (${user.data.username}) - ${user.data.xu.toLocaleString()} xu`);
    } catch (error) {
      console.error(`❌ Failed to create ${key}:`, error);
    }
  }

  console.log("\n📊 Creating leaderboard entries...\n");

  // Create leaderboard data
  for (const user of testUsers) {
    const key = `leaderboard:${user.userId}`;
    const value = JSON.stringify({
      userId: user.userId,
      username: user.data.username,
      xu: user.data.xu,
    });
    
    try {
      const cmd = `bunx wrangler kv key put --namespace-id=${KV_NAMESPACE_ID} "${key}" "${value.replace(/"/g, '\\"')}"`;
      await execAsync(cmd);
      console.log(`✅ Created leaderboard:${user.userId}`);
    } catch (error) {
      console.error(`❌ Failed to create ${key}:`, error);
    }
  }

  console.log("\n🎉 Test data created successfully!");
  console.log(`📈 Total users: ${testUsers.length}`);
  console.log(`💰 Total xu: ${testUsers.reduce((sum, u) => sum + u.data.xu, 0).toLocaleString()}`);
  
  console.log("\n📋 Verify data:");
  console.log(`   bunx wrangler kv key list --namespace-id=${KV_NAMESPACE_ID}`);
  console.log("\n🚀 Now run migration:");
  console.log(`   bun run migrate:run`);
}

populateKV().catch(console.error);
