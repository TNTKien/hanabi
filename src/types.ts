export interface UserData {
  xu: number;
  lastLucky?: number;
  username?: string;
  lastBox?: number;
  buffActive?: boolean;
  buffMultiplier?: number;
  lastFish?: number;
  fishCollection?: Record<string, number>;
}

export interface Env {
  GAME_DB: KVNamespace;
  DISCORD_APPLICATION_ID: string;
}

export const HOUSE_USER_ID = "559979358404608001";
