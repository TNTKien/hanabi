import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "5edb5b80-2757-46d3-ac48-607f19e39b97",
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
} satisfies Config;
