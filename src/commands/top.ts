import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, getTopUsers } from "../utils/database";

export async function topCommand(c: CommandContext<{ Bindings: Env }>) {
  const topUsers = await getTopUsers(c.env.GAME_DB, 10);

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

  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (userId) {
    const allUsers = await getTopUsers(c.env.GAME_DB, 1000);
    const userRank = allUsers.findIndex((u) => u.userId === userId);

    if (userRank >= 10) {
      const userData = await getUserData(userId, c.env.GAME_DB);
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
