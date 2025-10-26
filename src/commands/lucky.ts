import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function luckyCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // Defer response immediately to prevent race condition
  const webhookUrl = `https://discord.com/api/v10/webhooks/${c.env.DISCORD_APPLICATION_ID}/${c.interaction.token}/messages/@original`;
  const username = c.interaction.member?.user.username || c.interaction.user?.username || "Unknown";

  c.executionCtx.waitUntil(
    (async () => {
      try {
        // Check cooldown INSIDE async function to prevent race condition
        const db = initDB(c.env.DB);
        const userData = await getUserData(userId, db);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (userData.lastLucky && now - userData.lastLucky < oneDay) {
          const timeLeft = oneDay - (now - userData.lastLucky);
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

          await fetch(webhookUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              content: `Bạn đã nhận xu hôm nay rồi!\nThời gian còn lại: **${hoursLeft} giờ ${minutesLeft} phút**`
            }),
          });
          return;
        }

        const luckyAmount = Math.floor(Math.random() * 10001); // 0-10000
        userData.xu += luckyAmount;
        userData.lastLucky = now;

        // Update username and leaderboard
        userData.username = username;
        await saveUserData(userId, userData, db);
        await updateLeaderboard(userId, username, userData.xu, db);

        const result = `🍀 Lucky! Bạn nhận được **${luckyAmount} xu**\nTổng xu: **${userData.xu} xu**`;
        await sendCommandLog(c.env, username, userId, "/lucky", `got=${luckyAmount}, total=${userData.xu}`);
        
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: result }),
        });
      } catch (error) {
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "❌ Đã xảy ra lỗi khi nhận xu may mắn!" }),
        });
      }
    })()
  );

  return new Response(
    JSON.stringify({ type: 5 }), // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    { headers: { "Content-Type": "application/json" } }
  );
}
