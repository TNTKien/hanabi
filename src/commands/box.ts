import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function boxCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  const username = c.interaction.member?.user.username || c.interaction.user?.username || "Unknown";
  
  // Defer response immediately to prevent race condition
  const webhookUrl = `https://discord.com/api/v10/webhooks/${c.env.DISCORD_APPLICATION_ID}/${c.interaction.token}/messages/@original`;

  c.executionCtx.waitUntil(
    (async () => {
      try {
        // Check cooldown INSIDE async function to prevent race condition
        const kv = initDB(c.env.DB);
        const userData = await getUserData(userId, kv);
        const now = Date.now();

        // Check cooldown (3 boxes per day = 8 hours cooldown)
        const cooldownTime = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        if (userData.lastBox && now - userData.lastBox < cooldownTime) {
          const timeLeft = cooldownTime - (now - userData.lastBox);
          const hours = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
          
          await fetch(webhookUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              content: `⏰ Bạn đã mở hộp rồi! Quay lại sau **${hours}h ${minutes}m**`
            }),
          });
          return;
        }

        // Determine outcome
        const random = Math.random() * 100;
        let result: string;
        let xuChange: number;
        let specialBuff = false;

        if (random < 5) {
          // 5% chance: Special buff (2x winnings for next game)
          xuChange = Math.floor(Math.random() * 2001) + 1000; // 1000-3000 xu
          specialBuff = true;
          result = `🎊 **JACKPOT!** Bạn nhận được **${xuChange} xu** và **buff x2** cho trò chơi tiếp theo!`;
        } else if (random < 20) {
          // 15% chance: Big reward or small loss
          if (Math.random() < 0.3) {
            // 30% of 15% = 4.5% total: Small loss
            xuChange = -(Math.floor(Math.random() * 451) + 50); // -50 to -500 xu
            result = `💥 **BOOM!** Hộp phát nổ! Bạn mất **${Math.abs(xuChange)} xu**!`;
          } else {
            // 70% of 15% = 10.5% total: Big reward
            xuChange = Math.floor(Math.random() * 4001) + 1000; // 1000-5000 xu
            result = `✨ **RARE!** Bạn nhận được **${xuChange} xu**!`;
          }
        } else {
          // 80% chance: Normal reward
          xuChange = Math.floor(Math.random() * 1901) + 100; // 100-2000 xu
          result = `📦 Bạn mở hộp và nhận được **${xuChange} xu**!`;
        }

        // Update user data
        userData.xu += xuChange;
        userData.lastBox = now;
        if (specialBuff) {
          userData.buffActive = true;
          userData.buffMultiplier = 2;
        }

        await saveUserData(userId, userData, kv);
        await updateLeaderboard(userId, username, userData.xu, kv);

        const out = `🎁 **Mystery Box**\n\n${result}\n\n💰 Số xu hiện tại: **${userData.xu} xu**${specialBuff ? '\n🔥 Buff x2 đang active!' : ''}`;
        await sendCommandLog(c.env, username, userId, "/box", result + ` | balance=${userData.xu}`);
        
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: out }),
        });
      } catch (error) {
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "❌ Đã xảy ra lỗi khi mở hộp!" }),
        });
      }
    })()
  );

  return new Response(
    JSON.stringify({ type: 5 }), // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    { headers: { "Content-Type": "application/json" } }
  );
}
