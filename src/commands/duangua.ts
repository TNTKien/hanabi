import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";

interface UmaInfo {
  id: string;
  name: string;
  emoji: string;
  speed: number;
  multiplier: number;
}

export async function duanguaCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
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

  // Randomize stats for each uma
  const umas: UmaInfo[] = baseUmas.map((uma) => {
    // Speed: 0.05 - 0.45 (random)
    const speed = Math.random() * 0.4 + 0.05;
    // Multiplier inverse to speed: higher speed = lower multiplier
    // Speed 0.45 -> x2, Speed 0.05 -> x6
    const multiplier = Math.round((2 + (0.45 - speed) * 10) * 10) / 10;

    return {
      ...uma,
      speed: Math.round(speed * 100) / 100,
      multiplier: Math.max(2, Math.min(6, multiplier)),
    };
  });

  const positions = umas.map((uma) => ({
    ...uma,
    position: 0,
  }));

  const FINISH_LINE = 40;
  const chosenUmaInfo = umas.find((u) => u.id === chosenUma);

  // Tạo initial response với deferred
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

  // Webhook URL để update message
  const webhookUrl = `https://discord.com/api/v10/webhooks/${c.env.DISCORD_APPLICATION_ID}/${c.interaction.token}/messages/@original`;

  // Run race trong background (không await)
  c.executionCtx.waitUntil(
    (async () => {
      // Initial message
      let initialMsg = `🏇 ĐUA NGỰA - BẮT ĐẦU!\n\n`;
      initialMsg += `Bạn chọn: ${chosenUmaInfo?.emoji} **${chosenUmaInfo?.name}**\n`;
      initialMsg += `Tỉ lệ cược: **x${
        chosenUmaInfo?.multiplier
      }** (Tốc độ: ${Math.round((chosenUmaInfo?.speed || 0) * 100)}%)\n`;
      initialMsg += `Cược: **${betAmount} xu** → Có thể thắng: **${Math.floor(
        betAmount * (chosenUmaInfo?.multiplier || 1)
      )} xu**\n\n`;
      initialMsg += `━━━━━━━━━━━━━━━━━━━━🏁\n`;
      for (const uma of positions) {
        initialMsg += `${uma.emoji} ░░░░░░░░░░░░ (0)\n`;
      }

      await fetch(webhookUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: initialMsg }),
      });

      // Run the race
      let round = 0;
      let winner: (typeof positions)[0] | null = null;

      while (!winner) {
        round++;

        for (const uma of positions) {
          const baseMove = Math.floor(Math.random() * 3) + 1;
          const speedBonus = Math.random() < uma.speed ? 1 : 0;
          uma.position += baseMove + speedBonus;

          if (uma.position >= FINISH_LINE && !winner) {
            winner = uma;
          }
        }

        // Update every 2 rounds
        if (round % 2 === 0 || winner) {
          let updateMsg = `🏇 ĐUA NGỰA - ${
            winner ? "KẾT THÚC!" : `VÒNG ${round}`
          }\n\n`;
          updateMsg += `Bạn chọn: ${chosenUmaInfo?.emoji} **${chosenUmaInfo?.name}**\n`;
          updateMsg += `Tỉ lệ cược: **x${
            chosenUmaInfo?.multiplier
          }** (Tốc độ: ${Math.round((chosenUmaInfo?.speed || 0) * 100)}%)\n`;
          updateMsg += `Cược: **${betAmount} xu** → Có thể thắng: **${Math.floor(
            betAmount * (chosenUmaInfo?.multiplier || 1)
          )} xu**\n\n`;
          updateMsg += `━━━━━━━━━━━━━━━━━━━━🏁\n`;

          for (const uma of positions) {
            const progress = Math.min(
              Math.floor((uma.position / FINISH_LINE) * 12),
              12
            );
            const bar = "█".repeat(progress) + "░".repeat(12 - progress);
            updateMsg += `${uma.emoji} ${bar} (${uma.position})\n`;
          }

          // Add winner info if race ended
          if (winner) {
            updateMsg += `\n🏆 **CHIẾN THẮNG: ${winner.emoji} ${winner.name}!**\n\n`;

            const isWin = winner.id === chosenUma;

            if (isWin) {
              const winAmount = Math.floor(betAmount * winner.multiplier);
              userData.xu += winAmount;
              updateMsg += `**THẮNG!** +${winAmount} xu (x${winner.multiplier})`;
            } else {
              userData.xu -= betAmount;
              updateMsg += `**THUA!** -${betAmount} xu`;
            }

            updateMsg += `\nTổng xu: **${userData.xu} xu**`;

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
          }

          await fetch(webhookUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: updateMsg }),
          });

          // Small delay for visual effect
          if (!winner) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }

        if (round > 30) break;
      }

      if (!winner) {
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
