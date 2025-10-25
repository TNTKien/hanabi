import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

export async function napCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Unable to identify user!");

  const houseUserId = c.env.HOUSE_USER_ID;
  if (!houseUserId) {
    return c.res({
      content: "❌ Cấu hình HOUSE_USER_ID chưa được thiết lập!",
      flags: 64,
    });
  }

  // Check if user is the house (only house can use this command)
  if (userId !== houseUserId) {
    return c.res({
      content:
        "❌ Bạn không có quyền sử dụng lệnh này!\nChỉ nhà cái mới có thể nạp xu.",
      flags: 64, // Ephemeral
    });
  }

  // @ts-ignore
  const targetUserId = c.get("user") as string;
  // @ts-ignore
  const amount = parseInt(c.get("amount") as string);

  if (!targetUserId || !amount || amount <= 0 || isNaN(amount)) {
    return c.res({
      content:
        "❌ Vui lòng nhập đúng thông tin!\n\nCách dùng: `/nap @user <số xu>`",
      flags: 64,
    });
  }

  // Defer response
  const webhookUrl = `https://discord.com/api/v10/webhooks/${c.env.DISCORD_APPLICATION_ID}/${c.interaction.token}/messages/@original`;

  c.executionCtx.waitUntil(
    (async () => {
      try {
        const db = initDB(c.env.DB);

        // Get target user data
        const targetUserData = await getUserData(targetUserId, db);
        const oldBalance = targetUserData.xu;

        // Add xu to target user
        targetUserData.xu += amount;

        // Get target username (use existing or default)
        const targetUsername = targetUserData.username || "Unknown User";

        // Update username and save
        await saveUserData(targetUserId, targetUserData, db);
        await updateLeaderboard(
          targetUserId,
          targetUsername,
          targetUserData.xu,
          db
        );

        await sendCommandLog(
          c.env,
          c.interaction.member?.user.username ||
            c.interaction.user?.username ||
            "Unknown",
          userId,
          `/nap ${targetUserId} ${amount}`,
          `old=${oldBalance}, new=${targetUserData.xu}`
        );

        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `✅ **NẠP XU THÀNH CÔNG**

**Người nhận:** ${targetUsername} (<@${targetUserId}>)
**Số xu nạp:** +${amount.toLocaleString()} xu
**Số dư cũ:** ${oldBalance.toLocaleString()} xu
**Số dư mới:** ${targetUserData.xu.toLocaleString()} xu`,
          }),
        });
      } catch (error) {
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "❌ Đã xảy ra lỗi khi nạp xu!" }),
        });
      }
    })()
  );

  return new Response(
    JSON.stringify({ type: 5 }), // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    { headers: { "Content-Type": "application/json" } }
  );
}
