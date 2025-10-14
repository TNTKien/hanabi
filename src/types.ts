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
  GAME_DB: KVNamespace;
  DISCORD_APPLICATION_ID: string;
  DISCORD_TOKEN?: string;
}

export const HOUSE_USER_ID = "559979358404608001";
export const BLACKLISTED_USER_IDS = ["743400624422387772"];
