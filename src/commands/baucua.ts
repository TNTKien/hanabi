import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";
import { validateBetAmount, calculateWinAmount, updateUserXu, updateUserXuOnLoss } from "../utils/validation";

export async function baucuaCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const choice = c.get("chon") as string;
  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);

  if (!choice) {
    return c.res({
      content: "❌ Vui lòng chọn con vật!",
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
        const animals = ["cua", "tom", "ca", "nai", "bau", "ga"];
        const animalEmojis: Record<string, string> = {
          cua: "🦀",
          tom: "🦐",
          ca: "🐟",
          nai: "🦌",
          bau: "🎃",
          ga: "🐓",
        };
        const animalNames: Record<string, string> = {
          cua: "Cua",
          tom: "Tôm",
          ca: "Cá",
          nai: "Nai",
          bau: "Bầu",
          ga: "Gà",
        };

        const roll1 = animals[Math.floor(Math.random() * animals.length)];
        const roll2 = animals[Math.floor(Math.random() * animals.length)];
        const roll3 = animals[Math.floor(Math.random() * animals.length)];

        const matches = [roll1, roll2, roll3].filter((r) => r === choice).length;

        let resultText = `Kết quả: ${animalEmojis[roll1]} ${animalEmojis[roll2]} ${animalEmojis[roll3]}\n`;
        resultText += `${animalNames[roll1]} - ${animalNames[roll2]} - ${animalNames[roll3]}\n\n`;
        resultText += `Bạn chọn: ${animalEmojis[choice]} ${animalNames[choice]}\n\n`;

        if (matches === 0) {
          // Sử dụng updateUserXuOnLoss để xử lý trường hợp không đủ xu
          const lossUpdate = updateUserXuOnLoss(userData.xu, betAmount);
          userData.xu = lossUpdate.newXu;
          
          if (lossUpdate.actualLoss < betAmount) {
            resultText += `**THUA!** -${lossUpdate.actualLoss.toLocaleString()} xu (Hết xu!)`;
          } else {
            resultText += `**THUA!** -${betAmount.toLocaleString()} xu`;
          }
        } else {
          // House edge: Giảm multiplier xuống 0.9x cho mỗi match
          let finalMultiplier = matches * 0.9; // 0.9x, 1.8x, 2.7x thay vì 1x, 2x, 3x
          let buffText = "";
          
          // Apply buff if active
          if (userData.buffActive && userData.buffMultiplier) {
            finalMultiplier = finalMultiplier * userData.buffMultiplier;
            buffText = ` 🔥x${userData.buffMultiplier} buff!`;
            // Consume buff after use
            userData.buffActive = false;
            userData.buffMultiplier = undefined;
          }
          
          const winCalc = calculateWinAmount(betAmount, finalMultiplier);
          
          if (!winCalc.success) {
            await fetch(webhookUrl, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: winCalc.error + "\n⚠️ Vui lòng giảm số xu cược!" }),
            });
            return;
          }
          
          const winAmount = winCalc.amount!;
          const xuUpdate = updateUserXu(userData.xu, winAmount);
          
          if (!xuUpdate.success) {
            await fetch(webhookUrl, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: xuUpdate.error + "\n🎉 Bạn đã đạt giới hạn xu tối đa!" }),
            });
            return;
          }
          
          userData.xu = xuUpdate.newXu!;
          resultText += `**THẮNG ${matches}x!** +${winAmount.toLocaleString()} xu (x${finalMultiplier.toFixed(1)}${buffText})`;
        }

        resultText += `\nTổng xu: **${userData.xu.toLocaleString()} xu**`;

        // Update username and leaderboard
        userData.username = username;
        await saveUserData(userId, userData, db);
        await updateLeaderboard(userId, username, userData.xu, db);

        await sendCommandLog(c.env, username, userId, "/baucua", resultText);
        
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: resultText }),
        });
      } catch (error) {
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "❌ Đã xảy ra lỗi khi chơi bầu cua!" }),
        });
      }
    })()
  );

  return new Response(
    JSON.stringify({ type: 5 }), // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    { headers: { "Content-Type": "application/json" } }
  );
}
