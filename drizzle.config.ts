import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "b79c56e0-90a8-4059-bff3-986948af988a",
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
} satisfies Config;
