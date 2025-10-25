import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";
import { validateBetAmount, updateUserXu } from "../utils/validation";

export async function chuyenxuCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const targetUserId = c.get("nguoi_nhan") as string;
  // @ts-ignore
  const amount = parseInt(c.get("so_xu") as string);

  // Validate target user
  if (!targetUserId) {
    return c.res({
      content: "❌ Vui lòng chọn người nhận!",
      flags: 64,
    });
  }

  // Check if trying to transfer to self
  if (targetUserId === userId) {
    return c.res({
      content: "❌ Bạn không thể chuyển xu cho chính mình!",
      flags: 64,
    });
  }

  // Check if target is blacklisted
  if (isBlacklisted(targetUserId)) {
    return c.res({
      content: "❌ Không thể chuyển xu cho người dùng này!",
      flags: 64,
    });
  }

  const db = initDB(c.env.DB);
  const senderData = await getUserData(userId, db);

  // Validate amount (minimum 100 xu to prevent spam)
  const validation = validateBetAmount(amount, senderData.xu, 100);
  if (!validation.valid) {
    return c.res({
      content: validation.error,
      flags: 64,
    });
  }

  // Get target user data
  const targetData = await getUserData(targetUserId, db);

  // Deduct from sender
  const senderUpdate = updateUserXu(senderData.xu, -amount);
  if (!senderUpdate.success) {
    return c.res({
      content: senderUpdate.error,
      flags: 64,
    });
  }

  // Add to target
  const targetUpdate = updateUserXu(targetData.xu, amount);
  if (!targetUpdate.success) {
    return c.res({
      content: "❌ Người nhận đã đạt giới hạn xu tối đa!",
      flags: 64,
    });
  }

  // Update both users
  senderData.xu = senderUpdate.newXu!;
  targetData.xu = targetUpdate.newXu!;

  const senderUsername =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  senderData.username = senderUsername;

  // Get target username - will be "Unknown" if not available
  // @ts-ignore - Discord interaction data structure
  const targetUser = c.interaction.data?.resolved?.users?.[targetUserId];
  const targetUsername = targetUser?.username || `User-${targetUserId.slice(-4)}`;
  targetData.username = targetUsername;

  await saveUserData(userId, senderData, db);
  await saveUserData(targetUserId, targetData, db);
  
  await updateLeaderboard(userId, senderUsername, senderData.xu, db);
  await updateLeaderboard(targetUserId, targetUsername, targetData.xu, db);

  const resultText = `💸 **Chuyển xu thành công!**\n\n` +
    `Từ: **${senderUsername}**\n` +
    `Đến: **${targetUsername}**\n` +
    `Số xu: **${amount.toLocaleString()} xu**\n\n` +
    `💰 Xu còn lại của bạn: **${senderData.xu.toLocaleString()} xu**`;

  await sendCommandLog(
    c.env,
    senderUsername,
    userId,
    `/chuyenxu @${targetUsername} ${amount}`,
    `transferred ${amount} xu to ${targetUsername} (${targetUserId})`
  );

  return c.res({ content: resultText });
}
