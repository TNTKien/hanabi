import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function baucuaCommand(c: CommandContext<{ Bindings: Env }>) {
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
    userData.xu -= betAmount;
    resultText += `**THUA!** -${betAmount} xu`;
  } else {
    const winAmount = betAmount * matches;
    userData.xu += winAmount;
    resultText += `**THẮNG ${matches}x!** +${winAmount} xu`;
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

  await sendCommandLog(c.env, username, userId, "/baucua", resultText);
  return c.res({ content: resultText });
}
