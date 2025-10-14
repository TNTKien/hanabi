export const BLACKLISTED_USER_IDS: string[] = [
  // Add user IDs as strings here to block them from using the bot
  // Example: "123456789012345678",
];

export function isBlacklisted(userId?: string) {
  if (!userId) return false;
  return BLACKLISTED_USER_IDS.includes(userId);
}

/**
 * Returns a simple message content when a user is blacklisted.
 */
export function blacklistedResponse() {
  return {
    content: "⚠️ Bạn không được phép sử dụng bot này.",
    flags: 64, // ephemeral
  };
}
