import type { CommandContext } from "discord-hono";
import type { Env, BACharacter } from "../types";
import { initDB, getCurrentBanner, createBanner } from "../db";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";
import baCharacters from "../data/ba-characters.json";

// Get current banner character (same logic as gacha.ts)
async function getBannerInfo(db: ReturnType<typeof initDB>, game: string): Promise<{ character: BACharacter; timeLeft: string } | null> {
  if (game !== "blue_archive") return null;

  const banner = await getCurrentBanner(db, game);
  
  const now = Date.now();
  
  if (banner) {
    const timeLeft = banner.endTime - now;
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    
    const character = (baCharacters as BACharacter[]).find(c => c.id === banner.characterId);
    if (character) {
      return { character, timeLeft: `${hoursLeft}h ${minutesLeft}m` };
    }
  }
  
  // Need to create new banner
  const ssrCharacters = (baCharacters as BACharacter[]).filter(c => c.rarity === "SSR");
  const randomSSR = ssrCharacters[Math.floor(Math.random() * ssrCharacters.length)];
  
  await createBanner(db, game, randomSSR.id);
  return { character: randomSSR, timeLeft: "24h 0m" };
}

export async function bannerCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  
  const db = initDB(c.env.DB);

  // @ts-ignore - get game option
  const game = c.get("game") as string;
  
  if (game !== "blue_archive") {
    return c.res({
      content: "❌ Game không hợp lệ! Hiện tại chỉ hỗ trợ **Blue Archive**.",
      flags: 64,
    });
  }

  const bannerInfo = await getBannerInfo(db, game);

  if (!bannerInfo) {
    return c.res({
      content: "❌ Không thể tải thông tin banner!",
      flags: 64,
    });
  }

  const { character: bannerCharacter, timeLeft } = bannerInfo;

  let output = `⭐ **Blue Archive - Rate-Up Banner** ⭐\n\n`;
  output += `🟪 **${bannerCharacter.name}**\n`;
  output += `📋 Role: ${bannerCharacter.role}\n`;
  output += `🎯 Range: ${bannerCharacter.range}\n`;
  output += `🔫 Weapon: ${bannerCharacter.weaponType}\n`;
  output += `🏫 School: ${bannerCharacter.school}\n`;
  output += `🎪 Club: ${bannerCharacter.club}\n\n`;
  output += `⏰ Thời gian còn lại: **${timeLeft}**\n\n`;
  output += `✨ **Rate-Up:** Tỷ lệ nhận được ${bannerCharacter.name} tăng gấp đôi!\n`;
  output += `💰 Cost: **1,200 xu** cho 10 rolls (guaranteed SR+)`;

  await sendCommandLog(c.env, c.interaction.member?.user.username || c.interaction.user?.username || "Unknown", c.interaction.member?.user.id || c.interaction.user?.id, "/banner", `banner=${bannerCharacter.name}`);
  return c.res({ content: output });
}
