import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, getTopUsers } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function topCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  const username = c.interaction.member?.user.username || c.interaction.user?.username || "Unknown";
  await sendCommandLog(c.env, username, userId, "/top", "invoked");
  
  const db = initDB(c.env.DB);
  const topUsers = await getTopUsers(db, 10);

  if (topUsers.length === 0) {
    return c.res({
      content: "Chưa có dữ liệu người chơi!",
      flags: 64,
    });
  }

  let leaderboardText = `🏆 BẢNG XẾP HẠNG TOP 10\n\n`;

  topUsers.forEach((user, index) => {
    const medal =
      index === 0
        ? "🥇"
        : index === 1
        ? "🥈"
        : index === 2
        ? "🥉"
        : `${index + 1}.`;
    leaderboardText += `${medal} **${
      user.username
    }** - ${user.xu.toLocaleString()} xu\n`;
  });

  if (userId) {
    const allUsers = await getTopUsers(db, 1000);
    const userRank = allUsers.findIndex((u) => u.userId === userId);

    if (userRank >= 10) {
      const userData = await getUserData(userId, db);
      leaderboardText += `\n━━━━━━━━━━━━━━━\n`;
      leaderboardText += `**Bạn:** #${
        userRank + 1
      } - ${userData.xu.toLocaleString()} xu`;
    }
  }

  return c.res({
    content: leaderboardText,
  });
}
