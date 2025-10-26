import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";
import {
  validateBetAmount,
  calculateWinAmount,
  updateUserXu,
  updateUserXuOnLoss,
} from "../utils/validation";

export async function slotCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);

  // Quick validation before defer
  const db = initDB(c.env.DB);
  const userData = await getUserData(userId, db);

  const validation = validateBetAmount(betAmount, userData.xu, 1000);
  if (!validation.valid) {
    return c.res({
      content: validation.error,
      flags: 64,
    });
  }

  const webhookUrl = `https://discord.com/api/v10/webhooks/${c.env.DISCORD_APPLICATION_ID}/${c.interaction.token}/messages/@original`;
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";

  c.executionCtx.waitUntil(
    (async () => {
      try {
        const symbols = [
          "🍒",
          "🍋",
          "🍊",
          "🍇",
          "🍉",
          "🍓",
          "🍌",
          "🍎",
          "🥝",
          "🍑",
          "💎",
          "⭐",
          "7️⃣",
        ];
        const weights = [20, 18, 17, 16, 15, 14, 13, 12, 11, 10, 0.5, 0.3, 0.2];

        const rollSymbol = () => {
          const total = weights.reduce((a, b) => a + b, 0);
          let random = Math.random() * total;

          for (let i = 0; i < symbols.length; i++) {
            random -= weights[i];
            if (random <= 0) return symbols[i];
          }
          return symbols[0];
        };

        const slot1 = rollSymbol();
        const slot2 = rollSymbol();
        const slot3 = rollSymbol();

        let resultText = `🎰 SLOT MACHINE\n\n`;
        resultText += `┃ ${slot1} ┃ ${slot2} ┃ ${slot3} ┃\n\n`;

        let winAmount = 0;
        let multiplier = 0;

        if (slot1 === slot2 && slot2 === slot3) {
          if (slot1 === "7️⃣") {
            multiplier = 40;
            resultText += `**🎉 JACKPOT! 7-7-7!**\n`;
          } else if (slot1 === "⭐") {
            multiplier = 15;
            resultText += `**⭐ SUPER WIN!**\n`;
          } else if (slot1 === "💎") {
            multiplier = 12;
            resultText += `**💎 MEGA WIN!**\n`;
          } else {
            multiplier = 8;
            resultText += `**🎊 BIG WIN! 3 giống nhau!**\n`;
          }
        } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
          const matchSymbol =
            slot1 === slot2 ? slot1 : slot2 === slot3 ? slot2 : slot1;

          if (matchSymbol === "7️⃣") {
            multiplier = 6;
            resultText += `**7️⃣ GREAT! 2 số 7!**\n`;
          } else if (matchSymbol === "⭐") {
            multiplier = 4;
            resultText += `**⭐ WIN! 2 sao!**\n`;
          } else if (matchSymbol === "💎") {
            multiplier = 3;
            resultText += `**💎 WIN! 2 kim cương!**\n`;
          }
        }

        if (multiplier > 0) {
          const winCalc = calculateWinAmount(betAmount, multiplier);

          if (!winCalc.success) {
            await fetch(webhookUrl, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: winCalc.error + "\n⚠️ Vui lòng giảm số xu cược!",
              }),
            });
            return;
          }

          winAmount = winCalc.amount!;

          const xuUpdate = updateUserXu(userData.xu, winAmount);
          if (!xuUpdate.success) {
            await fetch(webhookUrl, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: xuUpdate.error + "\n🎉 Bạn đã đạt giới hạn xu tối đa!",
              }),
            });
            return;
          }

          userData.xu = xuUpdate.newXu!;
          resultText += `**+${winAmount.toLocaleString()} xu** (x${multiplier})\n`;
        } else {
          const lossUpdate = updateUserXuOnLoss(userData.xu, betAmount);
          userData.xu = lossUpdate.newXu;

          if (lossUpdate.actualLoss < betAmount) {
            resultText += `**THUA!** -${lossUpdate.actualLoss.toLocaleString()} xu (Hết xu!)\n`;
          } else {
            resultText += `**THUA!** -${betAmount.toLocaleString()} xu\n`;
          }
        }

        resultText += `\nTổng xu: **${userData.xu.toLocaleString()} xu**`;

        userData.username = username;
        await saveUserData(userId, userData, db);
        await updateLeaderboard(userId, username, userData.xu, db);

        await sendCommandLog(c.env, username, userId, "/slot", resultText);

        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: resultText }),
        });
      } catch (error) {
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "❌ Đã xảy ra lỗi khi chơi slot!" }),
        });
      }
    })()
  );

  return new Response(JSON.stringify({ type: 5 }), {
    headers: { "Content-Type": "application/json" },
  });
}
