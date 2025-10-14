import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData, updateLeaderboard, rollDice } from "../utils/database";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function taixiuCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const choice = c.get("chon") as string;
  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);

  if (!choice || !betAmount || betAmount < 1 || isNaN(betAmount)) {
    return c.res({
      content: "❌ Vui lòng nhập đúng thông tin!",
      flags: 64,
    });
  }

  const userData = await getUserData(userId, c.env.GAME_DB);

  if (userData.xu < betAmount) {
    return c.res({
      content: `Bạn không đủ xu!`,
      flags: 64,
    });
  }

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
    userData.xu += betAmount;
    resultText += `**THẮNG!** +${betAmount} xu`;
  } else {
    userData.xu -= betAmount;
    resultText += `**THUA!** -${betAmount} xu`;
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

  await sendCommandLog(c.env, username, userId, "/taixiu", resultText);
  return c.res({ content: resultText });
}
