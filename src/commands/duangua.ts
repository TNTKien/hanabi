import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";
import { isBlacklisted, blacklistedResponse } from "../utils/blacklist";
import { sendCommandLog } from "../utils/logger";

interface UmaStats {
  speed: number;      // 🏃‍♀️ Maximum speed (400-1200)
  stamina: number;    // 💪 Endurance (400-1200)
  power: number;      // ⚡ Acceleration power (400-1200)
  guts: number;       // 💃 Fighting spirit (400-1200)
  wisdom: number;     // 💡 Intelligence (400-1200)
}

interface UmaInfo {
  id: string;
  name: string;
  emoji: string;
  stats: UmaStats;
  multiplier: number;
  position: number;
  currentStamina: number; // Current stamina during race
}

export async function duanguaCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);
  // @ts-ignore
  const chosenUma = c.get("uma") as string;

  if (!betAmount || betAmount < 1 || isNaN(betAmount) || !chosenUma) {
    return c.res({
      content: "Vui lòng nhập đúng thông tin!",
      flags: 64,
    });
  }

  const userData = await getUserData(userId, c.env.GAME_DB);

  if (userData.xu < betAmount) {
    return c.res({
      content: `Bạn không đủ xu! (Có: **${userData.xu} xu**)`,
      flags: 64,
    });
  }

  // Base uma data
  const baseUmas = [
    {
      id: "special_week",
      name: "Special Week",
      emoji: "<:special_week:1426674463457673296>",
    },
    {
      id: "tokai_teio",
      name: "Tokai Teio",
      emoji: "<:tokai_teio:1426674466456342710>",
    },
    {
      id: "kitasan_black",
      name: "Kitasan Black",
      emoji: "<:kitasan_black:1426674457312759869>",
    },
    {
      id: "oguri_cap",
      name: "Oguri Cap",
      emoji: "<:oguri_cap:1426674472265453829>",
    },
    {
      id: "tamamo_cross",
      name: "Tamamo Cross",
      emoji: "<:tamamo_cross:1426674469543612596>",
    },
    {
      id: "satono_diamond",
      name: "Satono Diamond",
      emoji: "<:satono_diamond:1426674460756545566>",
    },
    {
      id: "gold_ship",
      name: "Gold Ship",
      emoji: "<:gold_ship:1426674449910071438>",
    },
    {
      id: "haru_urara",
      name: "Haru Urara",
      emoji: "<:haru_urara:1426674452573323487>",
    },
  ];

  // Randomize stats for each uma (total max 1200 points per stat)
  const generateRandomStats = (): UmaStats => {
    return {
      speed: Math.floor(Math.random() * 801) + 400,      // 400-1200
      stamina: Math.floor(Math.random() * 801) + 400,    // 400-1200
      power: Math.floor(Math.random() * 801) + 400,      // 400-1200
      guts: Math.floor(Math.random() * 801) + 400,       // 400-1200
      wisdom: Math.floor(Math.random() * 801) + 400,     // 400-1200
    };
  };

  const umas: UmaInfo[] = baseUmas.map((uma) => {
    const stats = generateRandomStats();
    
    // Calculate total stats to determine multiplier
    const totalStats = stats.speed + stats.stamina + stats.power + stats.guts + stats.wisdom;
    const avgStat = totalStats / 5;
    
    // High stats -> low multiplier (easier to win)
    // Low stats -> high multiplier (harder to win, bigger reward)
    // avgStat: 400-1200 => multiplier: 6-2
    const multiplier = Math.round((8 - (avgStat / 200)) * 10) / 10;

    return {
      ...uma,
      stats,
      multiplier: Math.max(2, Math.min(6, multiplier)),
      position: 0,
      currentStamina: stats.stamina, // Start with full stamina
    };
  });

  const FINISH_LINE = 40;
  const chosenUmaInfo = umas.find((u) => u.id === chosenUma);

  // Helper function to format stats display
  const formatStats = (stats: UmaStats) => {
    return `🏃‍♀️${stats.speed} 💪${stats.stamina} ⚡${stats.power} 💃${stats.guts} 💡${stats.wisdom}`;
  };

  // Create initial deferred response
  const interactionResponse = new Response(
    JSON.stringify({
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // Webhook URL to update message
  const webhookUrl = `https://discord.com/api/v10/webhooks/${c.env.DISCORD_APPLICATION_ID}/${c.interaction.token}/messages/@original`;

  // Run race in background (no await)
  // Log invocation
  (async () => {
    try {
      const username = c.interaction.member?.user.username || c.interaction.user?.username || "Unknown";
      await sendCommandLog(c.env, username, userId, `/duangua ${chosenUma} ${betAmount}`, "started");
    } catch (e) {
      /* ignore */
    }
  })();

  c.executionCtx.waitUntil(
    (async () => {
      // Initial message with stats
      let initialMsg = `🏇 ĐUA NGỰA - BẮT ĐẦU!\n\n`;
      initialMsg += `Bạn chọn: ${chosenUmaInfo?.emoji} **${chosenUmaInfo?.name}**\n`;
      initialMsg += `Tỉ lệ cược: **x${chosenUmaInfo?.multiplier}**\n`;
      if (chosenUmaInfo) {
        initialMsg += `Chỉ số: ${formatStats(chosenUmaInfo.stats)}\n`;
      }
      initialMsg += `Cược: **${betAmount} xu** → Có thể thắng: **${Math.floor(
        betAmount * (chosenUmaInfo?.multiplier || 1)
      )} xu**\n\n`;
      initialMsg += `━━━━━━━━━━━━━━━━━━━━🏁\n`;
      for (const uma of umas) {
        initialMsg += `${uma.emoji} ░░░░░░░░░░░░ (0)\n`;
      }

      await fetch(webhookUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: initialMsg }),
      });

      // Run the race with 5 stats system
      let round = 0;
      let winner: UmaInfo | null = null;
      const finishers: UmaInfo[] = []; // Track top 3 finishers
      const isEndGame = () => round >= 25; // Limit to 25 rounds to avoid infinite loop

      while (finishers.length < 3 && !isEndGame()) {
        round++;

        for (const uma of umas) {
          // 🏃‍♀️ Speed: Affects base movement speed
          const speedFactor = uma.stats.speed / 1200; // 0.33-1.0
          const baseMove = Math.floor(Math.random() * 2 + 1 + speedFactor); // 1-4 steps
          
          // ⚡ Power: Affects burst acceleration (20% chance)
          const powerFactor = uma.stats.power / 1200;
          const powerBoost = Math.random() < powerFactor * 0.2 ? 1 : 0;
          
          // 💪 Stamina: Decreases over time, affects speed
          uma.currentStamina -= 30; // Lose stamina each turn
          const staminaFactor = Math.max(0, uma.currentStamina / uma.stats.stamina); // 0-1
          const staminaPenalty = staminaFactor < 0.3 ? -1 : 0; // Slow down when out of stamina
          
          // 💡 Wisdom: Helps recover stamina (10% chance)
          const wisdomFactor = uma.stats.wisdom / 1200;
          if (Math.random() < wisdomFactor * 0.1) {
            uma.currentStamina += 50; // Recover stamina
          }
          
          // 💃 Guts: Strong effect in final stretch (after 70%)
          const progressPercent = uma.position / FINISH_LINE;
          const gutsFactor = uma.stats.guts / 1200;
          const gutsBoost = progressPercent > 0.7 && Math.random() < gutsFactor * 0.3 ? 1 : 0;
          
          // Calculate total movement
          const totalMove = Math.max(1, baseMove + powerBoost + staminaPenalty + gutsBoost);
          uma.position += totalMove;

          // Check if uma finished (and not already in finishers)
          if (uma.position >= FINISH_LINE && !finishers.includes(uma)) {
            finishers.push(uma);
            if (!winner) winner = uma; // First finisher is the winner
          }
        }

        // Update every 2 rounds
        if (round % 2 === 0 || finishers.length >= 3 || isEndGame()) {
          let updateMsg = `🏇 ĐUA NGỰA - ${
            finishers.length >= 3 ? "KẾT THÚC!" : `VÒNG ${round}`
          }\n\n`;
          updateMsg += `Bạn chọn: ${chosenUmaInfo?.emoji} **${chosenUmaInfo?.name}**\n`;
          updateMsg += `Tỷ lệ cược: **x${chosenUmaInfo?.multiplier}**\n`;
          if (chosenUmaInfo) {
            updateMsg += `Chỉ số: ${formatStats(chosenUmaInfo.stats)}\n`;
          }
          updateMsg += `Cược: **${betAmount} xu** → Có thể thắng: **${Math.floor(
            betAmount * (chosenUmaInfo?.multiplier || 1)
          )} xu**\n\n`;
          updateMsg += `━━━━━━━━━━━━━━━━━━━━🏁\n`;

          for (const uma of umas) {
            const progress = Math.min(
              Math.floor((uma.position / FINISH_LINE) * 12),
              12
            );
            const bar = "█".repeat(progress) + "░".repeat(12 - progress);
            const staminaPercent = Math.round((uma.currentStamina / uma.stats.stamina) * 100);
            const staminaIcon = staminaPercent > 50 ? "💪" : staminaPercent > 20 ? "😮" : "💨";
            updateMsg += `${uma.emoji} ${bar} (${uma.position}) ${staminaIcon}\n`;
          }

          // Add results if race ended (top 3 finished)
          if (finishers.length >= 3) {
            updateMsg += `\n**━━━━━ KẾT QUẢ ━━━━━**\n`;
            updateMsg += `🥇 **1st:** ${finishers[0].emoji} ${finishers[0].name}\n`;
            updateMsg += `🥈 **2nd:** ${finishers[1].emoji} ${finishers[1].name}\n`;
            updateMsg += `🥉 **3rd:** ${finishers[2].emoji} ${finishers[2].name}\n\n`;

            // Calculate reward based on position
            const chosenPosition = finishers.findIndex(u => u.id === chosenUma);
            
            if (chosenPosition === 0) {
              // 1st place: Full multiplier
              const winAmount = Math.floor(betAmount * (chosenUmaInfo?.multiplier || 2));
              userData.xu += winAmount;
              updateMsg += `🥇 **VỀ NHẤT!** +${winAmount} xu (x${chosenUmaInfo?.multiplier})`;
            } else if (chosenPosition === 1) {
              // 2nd place: 50% of multiplier
              const multiplier = (chosenUmaInfo?.multiplier || 2) * 0.5;
              const winAmount = Math.floor(betAmount * multiplier);
              userData.xu += winAmount;
              updateMsg += `🥈 **VỀ NHÌ!** +${winAmount} xu (x${multiplier.toFixed(1)})`;
            } else if (chosenPosition === 2) {
              // 3rd place: 25% of multiplier (minimum break even)
              const multiplier = Math.max(1, (chosenUmaInfo?.multiplier || 2) * 0.25);
              const winAmount = Math.floor(betAmount * multiplier);
              userData.xu += winAmount;
              updateMsg += `🥉 **VỀ BA!** +${winAmount} xu (x${multiplier.toFixed(1)})`;
            } else {
              // Not in top 3: Lose bet
              userData.xu -= betAmount;
              updateMsg += `❌ **THUA!** -${betAmount} xu`;
            }

            updateMsg += `\n💰 Tổng xu: **${userData.xu} xu**`;

            // Update username and leaderboard
            const username =
              c.interaction.member?.user.username ||
              c.interaction.user?.username ||
              "Unknown";
            userData.username = username;
            await saveUserData(userId, userData, c.env.GAME_DB);
            await updateLeaderboard(
              userId,
              username,
              userData.xu,
              c.env.GAME_DB
            );
            // Send final command log
            try {
              const chosenName = chosenUmaInfo?.name || chosenUma || "-";
              const finalResult = `winner=${winner?.name || "-"}; balance=${userData.xu}`;
              await sendCommandLog(c.env, username, userId, `/duangua ${chosenName} ${betAmount}`, finalResult);
            } catch (e) {
              /* ignore */
            }
          }

          await fetch(webhookUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: updateMsg }),
          });

          // Small delay for visual effect
          if (finishers.length < 3) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }

        if (round > 30) break;
      }

      if (finishers.length < 3) {
        await fetch(webhookUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "Đã xảy ra lỗi trong cuộc đua!",
          }),
        });
      }
    })()
  );

  return interactionResponse;
}
