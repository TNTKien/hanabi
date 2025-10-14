import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { HOUSE_USER_ID } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function napCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Unable to identify user!");

  // Check if user is the house (only house can use this command)
  if (userId !== HOUSE_USER_ID) {
    return c.res({
      content: "❌ Bạn không có quyền sử dụng lệnh này!\nChỉ nhà cái mới có thể nạp xu.",
      flags: 64, // Ephemeral
    });
  }

  // @ts-ignore
  const targetUserId = c.get("user") as string;
  // @ts-ignore
  const amount = parseInt(c.get("amount") as string);

  if (!targetUserId || !amount || amount <= 0 || isNaN(amount)) {
    return c.res({
      content: "❌ Vui lòng nhập đúng thông tin!\n\nCách dùng: `/nap @user <số xu>`",
      flags: 64,
    });
  }

  // Get target user data
  const targetUserData = await getUserData(targetUserId, c.env.GAME_DB);
  const oldBalance = targetUserData.xu;
  
  // Add xu to target user
  targetUserData.xu += amount;

  // Get target username (use existing or default)
  const targetUsername = targetUserData.username || "Unknown User";
  
  // Update username and save
  await saveUserData(targetUserId, targetUserData, c.env.GAME_DB);
  await updateLeaderboard(targetUserId, targetUsername, targetUserData.xu, c.env.GAME_DB);

  await sendCommandLog(c.env, c.interaction.member?.user.username || c.interaction.user?.username || "Unknown", userId, `/nap ${targetUserId} ${amount}`, `old=${oldBalance}, new=${targetUserData.xu}`);

  return c.res({
    content: `✅ **NẠP XU THÀNH CÔNG**

**Người nhận:** ${targetUsername} (<@${targetUserId}>)
**Số xu nạp:** +${amount.toLocaleString()} xu
**Số dư cũ:** ${oldBalance.toLocaleString()} xu
**Số dư mới:** ${targetUserData.xu.toLocaleString()} xu

💰 Đã cập nhật vào bảng xếp hạng!`,
  });
}
