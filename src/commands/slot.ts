import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function slotCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);

  if (!betAmount || betAmount < 1 || isNaN(betAmount)) {
    return c.res({
      content: "❌ Vui lòng nhập số xu hợp lệ!",
      flags: 64,
    });
  }

  const userData = await getUserData(userId, c.env.GAME_DB);

  if (userData.xu < betAmount) {
    return c.res({
      content: `❌ Bạn không đủ xu! (Có: **${userData.xu} xu**)`,
      flags: 64,
    });
  }

  const symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "⭐", "7️⃣"];
  const weights = [25, 20, 20, 15, 10, 8, 2];

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
      multiplier = 50; // JACKPOT!
      resultText += `**JACKPOT! 7-7-7!**\n`;
    } else if (slot1 === "⭐") {
      multiplier = 20;
      resultText += `**SUPER WIN!**\n`;
    } else if (slot1 === "💎") {
      multiplier = 15;
      resultText += `**MEGA WIN!**\n`;
    } else {
      multiplier = 10;
      resultText += `**BIG WIN! 3 giống nhau!**\n`;
    }
  } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
    const matchSymbol =
      slot1 === slot2 ? slot1 : slot2 === slot3 ? slot2 : slot1;

    if (matchSymbol === "7️⃣") {
      multiplier = 8;
      resultText += `**GREAT! 2 số 7!**\n`;
    } else if (matchSymbol === "⭐") {
      multiplier = 5;
      resultText += `**WIN! 2 sao!**\n`;
    } else if (matchSymbol === "💎") {
      multiplier = 4;
      resultText += `**WIN! 2 kim cương!**\n`;
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
    winAmount = Math.floor(betAmount * multiplier);
    userData.xu += winAmount;
    resultText += `**+${winAmount} xu** (x${multiplier})\n`;
  } else {
    userData.xu -= betAmount;
    resultText += `**THUA!** -${betAmount} xu\n`;
  }

  resultText += `\nTổng xu: **${userData.xu} xu**`;

  // Update username and leaderboard
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  userData.username = username;
  await saveUserData(userId, userData, c.env.GAME_DB);
  await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);

  await sendCommandLog(c.env, username, userId, "/slot", resultText);
  return c.res({ content: resultText });
}
