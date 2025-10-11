import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";

export async function luckyCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  const userData = await getUserData(userId, c.env.GAME_DB);
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

  const luckyAmount = Math.floor(Math.random() * 101); // 0-100
  userData.xu += luckyAmount;
  userData.lastLucky = now;

  // Update username and leaderboard
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  userData.username = username;
  await saveUserData(userId, userData, c.env.GAME_DB);
  await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);

  return c.res({
    content: `🍀 Lucky! Bạn nhận được **${luckyAmount} xu**\nTổng xu: **${userData.xu} xu**`,
  });
}
