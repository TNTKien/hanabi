import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function luckyCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  const db = initDB(c.env.DB);
  const userData = await getUserData(userId, db);
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (userData.lastLucky && now - userData.lastLucky < oneDay) {
    const timeLeft = oneDay - (now - userData.lastLucky);
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    return c.res({
      content: `Bạn đã nhận xu hôm nay rồi!\nThời gian còn lại: **${hoursLeft} giờ ${minutesLeft} phút**`,
      flags: 64,
    });
  }

  const luckyAmount = Math.floor(Math.random() * 10001); // 0-10000
  userData.xu += luckyAmount;
  userData.lastLucky = now;

  // Update username and leaderboard
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  userData.username = username;
  await saveUserData(userId, userData, db);
  await updateLeaderboard(userId, username, userData.xu, db);

  const result = `🍀 Lucky! Bạn nhận được **${luckyAmount} xu**\nTổng xu: **${userData.xu} xu**`;
  await sendCommandLog(c.env, username, userId, "/lucky", `got=${luckyAmount}, total=${userData.xu}`);
  return c.res({ content: result });
}
