export interface UserData {
  xu: number;
  lastLucky?: number;
  username?: string;
  lastBox?: number;
  buffActive?: boolean;
  buffMultiplier?: number;
  lastFish?: number;
  fishCollection?: Record<string, number>;
  gachaCollection?: Record<string, Record<string, number>>; // game -> characterId -> count
}

export interface BACharacter {
  id: number;
  name: string;
  devname: string;
  rarity: "R" | "SR" | "SSR";
  role: string;
  range: string;
  weaponType: string;
  bulletType: string;
  armorType: string;
  equipment: string[];
  school: string;
  club: string;
  favoriteGift: string[];
}

export interface GachaBanner {
  game: string;
  characterId: number;
  startTime: number;
  endTime: number;
}

export interface Env {
  DB: D1Database; // D1 database
  DISCORD_APPLICATION_ID: string;
  DISCORD_TOKEN?: string;
  LOG_GUILD_ID?: string;
  LOG_CHANNEL_ID?: string;
  HOUSE_USER_ID?: string;
}
