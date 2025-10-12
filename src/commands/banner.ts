import type { CommandContext } from "discord-hono";
import type { Env, BACharacter } from "../types";
import baCharacters from "../data/ba-characters.json";

// Get current banner character (same logic as gacha.ts)
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
      const timeLeft = banner.endTime - now;
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      
      const character = (baCharacters as BACharacter[]).find(c => c.id === banner.characterId);
      return character ? { ...character, timeLeft: `${hoursLeft}h ${minutesLeft}m` } as any : null;
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
  return { ...randomSSR, timeLeft: "24h 0m" } as any;
}

export async function bannerCommand(c: CommandContext<{ Bindings: Env }>) {
  const kv = c.env.GAME_DB;

  // @ts-ignore - get game option
  const game = c.get("game") as string;
  
  if (game !== "blue_archive") {
    return c.res({
      content: "❌ Game không hợp lệ! Hiện tại chỉ hỗ trợ **Blue Archive**.",
      flags: 64,
    });
  }

  const bannerCharacter = await getCurrentBanner(kv, game) as any;

  if (!bannerCharacter) {
    return c.res({
      content: "❌ Không thể tải thông tin banner!",
      flags: 64,
    });
  }

  let output = `⭐ **Blue Archive - Rate-Up Banner** ⭐\n\n`;
  output += `🟪 **${bannerCharacter.name}**\n`;
  output += `📋 Role: ${bannerCharacter.role}\n`;
  output += `🎯 Range: ${bannerCharacter.range}\n`;
  output += `🔫 Weapon: ${bannerCharacter.weaponType}\n`;
  output += `🏫 School: ${bannerCharacter.school}\n`;
  output += `🎪 Club: ${bannerCharacter.club}\n\n`;
  output += `⏰ Thời gian còn lại: **${bannerCharacter.timeLeft}**\n\n`;
  output += `✨ **Rate-Up:** Tỷ lệ nhận được ${bannerCharacter.name} tăng gấp đôi!\n`;
  output += `💰 Cost: **1,200 xu** cho 10 rolls (guaranteed SR+)`;

  return c.res({
    content: output,
  });
}
