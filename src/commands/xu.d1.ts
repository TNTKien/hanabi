import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

/**
 * /xu command - Check user's xu balance
 * 
 * This is an EXAMPLE of migrated command using D1
 * Use this as reference for updating other commands
 */
export async function xuCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // Initialize D1 database
  const db = initDB(c.env.DB);
  const userData = await getUserData(userId, db);

  // Update username
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  if (!userData.username || userData.username !== username) {
    userData.username = username;
    await saveUserData(userId, userData, db);
    await updateLeaderboard(userId, username, userData.xu, db);
  }

  const resp = { content: `Bạn hiện có **${userData.xu} xu**`, flags: 64 };
  // Log command
  await sendCommandLog(c.env, username, userId, "/xu", `xu=${userData.xu}`);
  return c.res(resp);
}
