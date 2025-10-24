import type { UserData } from "../types";
import { capXu } from "./validation";

export async function getUserData(
  userId: string,
  kv: KVNamespace
): Promise<UserData> {
  const data = await kv.get(`user:${userId}`);
  if (!data) {
    return { xu: 10000 };
  }
  return JSON.parse(data);
}

export async function saveUserData(
  userId: string,
  data: UserData,
  kv: KVNamespace
) {
  // Cap xu at maximum before saving
  data.xu = capXu(data.xu);
  await kv.put(`user:${userId}`, JSON.stringify(data));
}

export async function updateLeaderboard(
  userId: string,
  username: string,
  xu: number,
  kv: KVNamespace
) {
  await kv.put(
    `leaderboard:${userId}`,
    JSON.stringify({ username, xu, userId })
  );
}

export async function getTopUsers(
  kv: KVNamespace,
  limit: number = 10
): Promise<Array<{ username: string; xu: number; userId: string }>> {
  const list = await kv.list({ prefix: "leaderboard:" });
  const users = await Promise.all(
    list.keys.map(async (key) => {
      const data = await kv.get(key.name);
      return data ? JSON.parse(data) : null;
    })
  );

  return users
    .filter((u) => u !== null)
    .sort((a, b) => b.xu - a.xu)
    .slice(0, limit);
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export async function transferToHouse(amount: number, kv: KVNamespace, houseUserId: string) {
  const houseData = await getUserData(houseUserId, kv);
  houseData.xu += amount;
  await saveUserData(houseUserId, houseData, kv);
}
