import type { CommandContext } from "discord-hono";
import type { Env, BACharacter } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import baCharacters from "../data/ba-characters.json";

const GACHA_COSTS: Record<string, number> = {
  "blue_archive": 1200, // 120 xu per roll * 10 rolls
};

const GACHA_RATES = {
  blue_archive: {
    R: 78.5,
    SR: 18.5,
    SSR: 1.5,
  },
};

const ROLLS_PER_PULL = 10;

// Get current banner character (rotates every 24 hours)
async function getCurrentBanner(kv: KVNamespace, game: string): Promise<BACharacter | null> {
  if (game !== "blue_archive") return null;

  const bannerKey = `banner:${game}`;
  const bannerData = await kv.get(bannerKey);
  
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (bannerData) {
    const banner = JSON.parse(bannerData);
    // Check if banner is still valid
    if (banner.endTime > now) {
      return (baCharacters as BACharacter[]).find(c => c.id === banner.characterId) || null;
    }
  }
  
  // Need to create new banner
  const ssrCharacters = (baCharacters as BACharacter[]).filter(c => c.rarity === "SSR");
  const randomSSR = ssrCharacters[Math.floor(Math.random() * ssrCharacters.length)];
  
  const newBanner = {
    game,
    characterId: randomSSR.id,
    startTime: now,
    endTime: now + oneDayMs,
  };
  
  await kv.put(bannerKey, JSON.stringify(newBanner));
  return randomSSR;
}

// Perform a single roll with rate-up consideration
function rollCharacter(bannerCharacter: BACharacter | null): BACharacter {
  const characters = baCharacters as BACharacter[];
  const random = Math.random() * 100;
  
  let targetRarity: "R" | "SR" | "SSR";
  if (random < GACHA_RATES.blue_archive.SSR) {
    targetRarity = "SSR";
  } else if (random < GACHA_RATES.blue_archive.SSR + GACHA_RATES.blue_archive.SR) {
    targetRarity = "SR";
  } else {
    targetRarity = "R";
  }
  
  const pool = characters.filter(c => c.rarity === targetRarity);
  
  // If we got SSR and there's a banner, 50% chance to get banner character
  if (targetRarity === "SSR" && bannerCharacter && Math.random() < 0.5) {
    return bannerCharacter;
  }
  
  return pool[Math.floor(Math.random() * pool.length)];
}

// Perform 10-pull with guaranteed SR+
function performTenPull(bannerCharacter: BACharacter | null): BACharacter[] {
  const results: BACharacter[] = [];
  
  // Roll 9 times normally
  for (let i = 0; i < 9; i++) {
    results.push(rollCharacter(bannerCharacter));
  }
  
  // Last roll: guaranteed SR or higher
  const hasHighRarity = results.some(c => c.rarity === "SR" || c.rarity === "SSR");
  
  if (hasHighRarity) {
    // Already have SR+, can roll normally
    results.push(rollCharacter(bannerCharacter));
  } else {
    // Force SR or SSR for last roll
    const characters = baCharacters as BACharacter[];
    const random = Math.random() * 100;
    let targetRarity: "SR" | "SSR";
    
    // Adjust rates for guaranteed SR+
    const ssrRate = GACHA_RATES.blue_archive.SSR;
    const srRate = GACHA_RATES.blue_archive.SR;
    const totalRate = ssrRate + srRate;
    
    if (random < (ssrRate / totalRate) * 100) {
      targetRarity = "SSR";
      const pool = characters.filter(c => c.rarity === "SSR");
      
      // If there's a banner, 50% chance to get banner character
      if (bannerCharacter && Math.random() < 0.5) {
        results.push(bannerCharacter);
      } else {
        results.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    } else {
      targetRarity = "SR";
      const pool = characters.filter(c => c.rarity === "SR");
      results.push(pool[Math.floor(Math.random() * pool.length)]);
    }
  }
  
  return results;
}

function getRarityEmoji(rarity: string): string {
  switch (rarity) {
    case "R": return "🟦";
    case "SR": return "🟨";
    case "SSR": return "🟪";
    default: return "⚪";
  }
}

function formatResults(results: BACharacter[], bannerCharacter: BACharacter | null): string {
  const counts = { R: 0, SR: 0, SSR: 0 };
  const ssrNames: string[] = [];
  const srNames: string[] = [];
  
  results.forEach(char => {
    counts[char.rarity]++;
    if (char.rarity === "SSR") {
      const isBanner = bannerCharacter && char.id === bannerCharacter.id;
      ssrNames.push(`${isBanner ? "⭐ " : ""}${char.name}`);
    } else if (char.rarity === "SR") {
      srNames.push(char.name);
    }
  });
  
  // Display as 5x2 grid
  let output = "**📊 Kết quả:**\n\n";
  
  // First row (5 cards)
  for (let i = 0; i < 5; i++) {
    output += getRarityEmoji(results[i].rarity) + " ";
  }
  output += "\n\n";
  
  // Second row (5 cards)
  for (let i = 5; i < 10; i++) {
    output += getRarityEmoji(results[i].rarity) + " ";
  }
  output += "\n\n";
  
  // Summary counts
  output += `🟦 R: ${counts.R} | 🟨 SR: ${counts.SR} | 🟪 SSR: ${counts.SSR}\n`;
  
  // List high rarity characters
  if (ssrNames.length > 0) {
    output += `\n🟪 **SSR:** ${ssrNames.join(", ")}`;
  }
  if (srNames.length > 0) {
    output += `\n🟨 **SR:** ${srNames.join(", ")}`;
  }
  
  return output;
}

export async function gachaCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  const username = c.interaction.member?.user.username || c.interaction.user?.username || "Unknown";
  const kv = c.env.GAME_DB;

  // @ts-ignore - get game option
  const game = c.get("game") as string;
  
  if (game !== "blue_archive") {
    return c.res({
      content: "❌ Game không hợp lệ! Hiện tại chỉ hỗ trợ **Blue Archive**.",
      flags: 64,
    });
  }

  const cost = GACHA_COSTS[game];
  const userData = await getUserData(userId, kv);

  // Check if user has enough xu
  if (userData.xu < cost) {
    return c.res({
      content: `❌ Không đủ xu! Bạn cần **${cost} xu** để gacha.\nSố xu hiện tại: **${userData.xu} xu**`,
      flags: 64,
    });
  }

  // Get current banner
  const bannerCharacter = await getCurrentBanner(kv, game);

  // Perform 10-pull
  const results = performTenPull(bannerCharacter);

  // Deduct xu
  userData.xu -= cost;

  // Update collection
  if (!userData.gachaCollection) {
    userData.gachaCollection = {};
  }
  if (!userData.gachaCollection[game]) {
    userData.gachaCollection[game] = {};
  }

  results.forEach(char => {
    const charId = char.id.toString();
    userData.gachaCollection![game][charId] = (userData.gachaCollection![game][charId] || 0) + 1;
  });

  await saveUserData(userId, userData, kv);
  await updateLeaderboard(userId, username, userData.xu, kv);

  // Format output
  let output = `🎰 **Blue Archive Gacha** 🎰\n\n`;
  
  if (bannerCharacter) {
    output += `⭐ **Rate-Up:** ${bannerCharacter.name} (x2 chance!)\n\n`;
  }
  
  output += formatResults(results, bannerCharacter);
  output += `\n💰 Xu còn lại: **${userData.xu} xu**`;

  // Check for SSR
  const ssrCount = results.filter(c => c.rarity === "SSR").length;
  if (ssrCount > 0) {
    output += `\n\n🎉 **CHÚC MỪNG! Bạn đã có ${ssrCount} SSR!** 🎉`;
  }

  return c.res({
    content: output,
  });
}
