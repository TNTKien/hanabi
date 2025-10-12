import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";

const FISH_TYPES = [
  // Common (70%)
  { name: "🐟 Cá Rô", rarity: "Common", minXu: 100, maxXu: 500, chance: 30 },
  { name: "🐠 Cá Chép", rarity: "Common", minXu: 100, maxXu: 500, chance: 25 },
  { name: "🐡 Cá Nóc", rarity: "Common", minXu: 100, maxXu: 500, chance: 15 },
  
  // Rare (25%)
  { name: "🐟 Cá Hồi", rarity: "Rare", minXu: 500, maxXu: 1500, chance: 15 },
  { name: "🐠 Cá Ngừ", rarity: "Rare", minXu: 500, maxXu: 1500, chance: 10 },
  
  // Epic (4%)
  { name: "🐡 Cá Mập", rarity: "Epic", minXu: 1500, maxXu: 5000, chance: 3 },
  { name: "🦈 Cá Mập Trắng", rarity: "Epic", minXu: 1500, maxXu: 5000, chance: 1 },
  
  // Legendary (1%)
  { name: "🐋 Cá Voi", rarity: "Legendary", minXu: 5000, maxXu: 20000, chance: 0.5 },
  { name: "🐉 Rồng Biển", rarity: "Legendary", minXu: 5000, maxXu: 20000, chance: 0.5 },
];

function selectFish() {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const fish of FISH_TYPES) {
    cumulative += fish.chance;
    if (random < cumulative) {
      const xu = Math.floor(Math.random() * (fish.maxXu - fish.minXu + 1)) + fish.minXu;
      return { ...fish, xu };
    }
  }
  
  // Fallback to most common fish
  const xu = Math.floor(Math.random() * 401) + 100;
  return { ...FISH_TYPES[0], xu };
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "Common": return "⚪";
    case "Rare": return "🔵";
    case "Epic": return "🟣";
    case "Legendary": return "🟡";
    default: return "⚪";
  }
}

export async function caucaCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  const username = c.interaction.member?.user.username || c.interaction.user?.username || "Unknown";
  const kv = c.env.GAME_DB;

  const userData = await getUserData(userId, kv);
  const now = Date.now();

  // Check cooldown (1 minute 30 seconds)
  const cooldownTime = 90 * 1000; // 90 seconds in milliseconds
  if (userData.lastFish && now - userData.lastFish < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - userData.lastFish)) / 1000);
    return c.res({
      content: `🎣 Bạn vừa câu cá rồi! Đợi **${timeLeft}s** nữa nhé!`,
      flags: 64,
    });
  }

  // Select random fish
  const caught = selectFish();
  const rarityEmoji = getRarityColor(caught.rarity);

  // Initialize fish collection if doesn't exist
  if (!userData.fishCollection) {
    userData.fishCollection = {};
  }
  
  // Track caught fish
  if (!userData.fishCollection[caught.name]) {
    userData.fishCollection[caught.name] = 0;
  }
  userData.fishCollection[caught.name]++;

  // Update user data
  userData.xu += caught.xu;
  userData.lastFish = now;

  await saveUserData(userId, userData, kv);
  await updateLeaderboard(userId, username, userData.xu, kv);

  // Count total unique fish
  const uniqueFish = Object.keys(userData.fishCollection).length;
  const totalFish = Object.values(userData.fishCollection).reduce((a, b) => a + b, 0);

  let resultMessage = `🎣 **Câu Cá**\n\n`;
  resultMessage += `${rarityEmoji} Bạn câu được: **${caught.name}**\n`;
  resultMessage += `✨ Độ hiếm: **${caught.rarity}**\n`;
  resultMessage += `💰 Nhận được: **+${caught.xu} xu**\n\n`;
  resultMessage += `💵 Số xu hiện tại: **${userData.xu} xu**\n`;
  resultMessage += `📊 Bộ sưu tập: **${uniqueFish}/${FISH_TYPES.length}** loài (${totalFish} con)`;

  // Special message for legendary catch
  if (caught.rarity === "Legendary") {
    resultMessage += `\n\n🎉 **CHÚC MỪNG! Bạn đã câu được cá huyền thoại!** 🎉`;
  }

  return c.res({
    content: resultMessage,
  });
}
