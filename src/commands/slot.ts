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

  const userData = await getUserData(userId, db);

  // Validate bet amount với mức tối thiểu 100 xu cho slot
  const validation = validateBetAmount(betAmount, userData.xu, 1000);
  if (!validation.valid) {
    return c.res({
      content: validation.error,
      flags: 64,
    });
  }

  // Thêm nhiều symbol hơn để tăng độ khó
  const symbols = ["🍒", "🍋", "🍊", "🍇", "🍉", "🍓", "🍌", "💎", "⭐", "7️⃣"];
  // Giảm mạnh tỷ lệ xuất hiện kim cương và sao, thêm symbols thường
  const weights = [18, 16, 15, 14, 13, 12, 10, 1, 0.5, 0.5];

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
    // Giữ nguyên mức phần thưởng như cũ
    if (slot1 === "7️⃣") {
      multiplier = 50; // JACKPOT!
      resultText += `**🎉 JACKPOT! 7-7-7!**\n`;
    } else if (slot1 === "⭐") {
      multiplier = 20;
      resultText += `**⭐ SUPER WIN!**\n`;
    } else if (slot1 === "💎") {
      multiplier = 15;
      resultText += `**💎 MEGA WIN!**\n`;
    } else {
      multiplier = 10;
      resultText += `**🎊 BIG WIN! 3 giống nhau!**\n`;
    }
  } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
    const matchSymbol =
      slot1 === slot2 ? slot1 : slot2 === slot3 ? slot2 : slot1;

    if (matchSymbol === "7️⃣") {
      multiplier = 8;
      resultText += `**7️⃣ GREAT! 2 số 7!**\n`;
    } else if (matchSymbol === "⭐") {
      multiplier = 5;
      resultText += `**⭐ WIN! 2 sao!**\n`;
    } else if (matchSymbol === "💎") {
      multiplier = 4;
      resultText += `**💎 WIN! 2 kim cương!**\n`;
    } else {
      multiplier = 3;
      resultText += `**WIN! 2 giống nhau!**\n`;
    }
  } else if (slot1 === "💎" || slot2 === "💎" || slot3 === "💎") {
    multiplier = 2;
    resultText += `**Lucky! Có kim cương!**\n`;
  } else if (slot1 === "⭐" || slot2 === "⭐" || slot3 === "⭐") {
    multiplier = 1.5;
    resultText += `**Bonus! Có sao!**\n`;
  }

  if (multiplier > 0) {
    const winCalc = calculateWinAmount(betAmount, multiplier);
    
    if (!winCalc.success) {
      return c.res({
        content: winCalc.error + "\n⚠️ Vui lòng giảm số xu cược!",
        flags: 64,
      });
    }
    
    winAmount = winCalc.amount!;
    
    const xuUpdate = updateUserXu(userData.xu, winAmount);
    if (!xuUpdate.success) {
      return c.res({
        content: xuUpdate.error + "\n🎉 Bạn đã đạt giới hạn xu tối đa!",
        flags: 64,
      });
    }
    
    userData.xu = xuUpdate.newXu!;
    resultText += `**+${winAmount.toLocaleString()} xu** (x${multiplier})\n`;
  } else {
    // Sử dụng updateUserXuOnLoss để xử lý trường hợp không đủ xu
    const lossUpdate = updateUserXuOnLoss(userData.xu, betAmount);
    userData.xu = lossUpdate.newXu;
    
    if (lossUpdate.actualLoss < betAmount) {
      resultText += `**THUA!** -${lossUpdate.actualLoss.toLocaleString()} xu (Hết xu!)\n`;
    } else {
      resultText += `**THUA!** -${betAmount.toLocaleString()} xu\n`;
    }
  }

  resultText += `\nTổng xu: **${userData.xu.toLocaleString()} xu**`;

  // Update username and leaderboard
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  userData.username = username;
  await saveUserData(userId, userData, db);
  await updateLeaderboard(userId, username, userData.xu, db);

  await sendCommandLog(c.env, username, userId, "/slot", resultText);
  return c.res({ content: resultText });
}
