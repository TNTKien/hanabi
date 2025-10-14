import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";

export async function xuCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  const userData = await getUserData(userId, c.env.GAME_DB);

  // Update username
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  if (!userData.username || userData.username !== username) {
    userData.username = username;
    await saveUserData(userId, userData, c.env.GAME_DB);
    await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);
  }

  return c.res({
    content: `Bạn hiện có **${userData.xu} xu**`,
    flags: 64, // Ephemeral
  });
}
