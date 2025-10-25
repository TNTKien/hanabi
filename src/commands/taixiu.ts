import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard, rollDice } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";
import { validateBetAmount, updateUserXu, updateUserXuOnLoss } from "../utils/validation";

export async function taixiuCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const choice = c.get("chon") as string;
  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);

  if (!choice) {
    return c.res({
      content: "❌ Vui lòng chọn Tài hoặc Xỉu!",
      flags: 64,
    });
  }

  // Quick validation before defer
  const db = initDB(c.env.DB);
  const userData = await getUserData(userId, db);

  // Validate bet amount
  const validation = validateBetAmount(betAmount, userData.xu, 1);
  if (!validation.valid) {
    return c.res({
      content: validation.error,
      flags: 64,
    });
  }

  // Defer response
  const webhookUrl = `https://discord.com/api/v10/webhooks/${c.env.DISCORD_APPLICATION_ID}/${c.interaction.token}/messages/@original`;
  const username = c.interaction.member?.user.username || c.interaction.user?.username || "Unknown";

  c.executionCtx.waitUntil(
    (async () => {
      try {
        const dice1 = rollDice();
        const dice2 = rollDice();
        const dice3 = rollDice();
        const total = dice1 + dice2 + dice3;

        const isTai = total >= 11 && total <= 17;
        const isXiu = total >= 4 && total <= 10;
        const isWin = (choice === "tai" && isTai) || (choice === "xiu" && isXiu);

        let resultText = `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = **${total}**\n`;
        resultText += `${isTai ? "**TÀI**" : "**XỈU**"}\n\n`;

        if (isWin) {
          // House edge: Thắng chỉ nhận 95% tiền cược
          const winAmount = Math.floor(betAmount * 0.95);
          const xuUpdate = updateUserXu(userData.xu, winAmount);
          if (!xuUpdate.success) {
            await fetch(webhookUrl, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: xuUpdate.error }),
            });
            return;
          }
          userData.xu = xuUpdate.newXu!;
          resultText += `**THẮNG!** +${winAmount.toLocaleString()} xu (x0.95)`;
        } else {
          // Sử dụng updateUserXuOnLoss để xử lý trường hợp không đủ xu
          const lossUpdate = updateUserXuOnLoss(userData.xu, betAmount);
          userData.xu = lossUpdate.newXu;
          
          if (lossUpdate.actualLoss < betAmount) {
            resultText += `**THUA!** -${lossUpdate.actualLoss.toLocaleString()} xu (Hết xu!)`;
          } else {
            resultText += `**THUA!** -${betAmount.toLocaleString()} xu`;
          }
        }

        resultText += `\nTổng xu: **${userData.xu.toLocaleString()} xu**`;

        // Update username and leaderboard
        userData.username = username;
        await saveUserData(userId, userData, db);
        await updateLeaderboard(userId, username, userData.xu, db);

        await sendCommandLog(c.env, username, userId, "/taixiu", resultText);
        
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: resultText }),
        });
      } catch (error) {
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "❌ Đã xảy ra lỗi khi chơi tài xỉu!" }),
        });
      }
    })()
  );

  return new Response(
    JSON.stringify({ type: 5 }), // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    { headers: { "Content-Type": "application/json" } }
  );
}
