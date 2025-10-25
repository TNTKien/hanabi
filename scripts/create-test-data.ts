/**
 * Script to populate test data in KV for migration testing
 * Run this before running migration
 */

import { config } from "dotenv";

config();

const KV_NAMESPACE_ID = "4779470a237a4d84b96c245bf7742173";
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env");
  process.exit(1);
}

async function putKVValue(key: string, value: string) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: value,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to put KV value: ${error}`);
  }

  return response.json();
}

async function createTestData() {
  console.log("Creating test data in KV...");

  // Test users
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
  ];

  // Create user data
  for (const user of testUsers) {
    const key = `user:${user.userId}`;
    const value = JSON.stringify(user.data);
    await putKVValue(key, value);
    console.log(`✅ Created ${key}`);
  }

  // Create leaderboard data
  for (const user of testUsers) {
    const key = `leaderboard:${user.userId}`;
    const value = JSON.stringify({
      userId: user.userId,
      username: user.data.username,
      xu: user.data.xu,
    });
    await putKVValue(key, value);
    console.log(`✅ Created ${key}`);
  }

  console.log("\n🎉 Test data created successfully!");
  console.log(`Total users: ${testUsers.length}`);
}

createTestData().catch(console.error);
