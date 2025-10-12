import type { UserData } from "../types";

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

export async function transferToHouse(amount: number, kv: KVNamespace) {
  const houseData = await getUserData(HOUSE_USER_ID, kv);
  houseData.xu += amount;
  await saveUserData(HOUSE_USER_ID, houseData, kv);
}

const HOUSE_USER_ID = "559979358404608001";
