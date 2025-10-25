import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, getTopUsers } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function topCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  const username = c.interaction.member?.user.username || c.interaction.user?.username || "Unknown";
  
  // Defer response
  const webhookUrl = `https://discord.com/api/v10/webhooks/${c.env.DISCORD_APPLICATION_ID}/${c.interaction.token}/messages/@original`;

  c.executionCtx.waitUntil(
    (async () => {
      try {
        await sendCommandLog(c.env, username, userId, "/top", "invoked");
        
        const db = initDB(c.env.DB);
        const topUsers = await getTopUsers(db, 10);

        if (topUsers.length === 0) {
          await fetch(webhookUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "Chưa có dữ liệu người chơi!" }),
          });
          return;
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

        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: leaderboardText }),
        });
      } catch (error) {
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "❌ Đã xảy ra lỗi khi tải bảng xếp hạng!" }),
        });
      }
    })()
  );

  return new Response(
    JSON.stringify({ type: 5 }), // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    { headers: { "Content-Type": "application/json" } }
  );
}
