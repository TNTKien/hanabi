export const LOG_GUILD_ID = "889490582072873001"; 
export const LOG_CHANNEL_ID = "1427562008747835422"; 
import type { Env } from "../types";

function safeString(v: any) {
  if (v === undefined || v === null) return "(none)";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch (_) {
    return String(v);
  }
}

export async function sendCommandLog(env: Env, username: string | undefined, userId: string | undefined, command: string, result?: string) {
  try {
    const token = env.DISCORD_TOKEN;
    if (!token) return; // no token available, skip logging

    const lines = [];
    lines.push(`User: ${safeString(username) } (${safeString(userId)})`);
    lines.push(`Command: ${safeString(command)}`);
    lines.push(`Result: ${safeString(result ?? "(none)")}`);

    // Wrap message in a code block for readability and add a visible separator after it
    const content = "```" + "\n" + lines.join("\n") + "\n```\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

    await fetch(`https://discord.com/api/v10/channels/${LOG_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
  } catch (e) {
    // swallow errors silently for now
    console.error("sendCommandLog error:", e);
  }
}
