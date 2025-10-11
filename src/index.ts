import { DiscordHono } from "discord-hono";

const HOUSE_USER_ID = "559979358404608001"; // Change to your Discord User ID

interface UserData {
  xu: number;
  lastLucky?: number;
  username?: string;
}

interface Env {
  GAME_DB: KVNamespace;
  DISCORD_APPLICATION_ID: string;
}

const app = new DiscordHono<{ Bindings: Env }>();

async function getUserData(userId: string, kv: KVNamespace): Promise<UserData> {
  const data = await kv.get(`user:${userId}`);
  if (!data) {
    return { xu: 1000 };
  }
  return JSON.parse(data);
}

async function saveUserData(userId: string, data: UserData, kv: KVNamespace) {
  await kv.put(`user:${userId}`, JSON.stringify(data));
}

async function updateLeaderboard(
  userId: string,
  username: string,
  xu: number,
  kv: KVNamespace
) {
  await kv.put(
    `leaderboard:${userId}`,
    JSON.stringify({ username, xu, userId })
  );
}

async function getTopUsers(
  kv: KVNamespace,
  limit: number = 10
): Promise<Array<{ username: string; xu: number; userId: string }>> {
  const list = await kv.list({ prefix: "leaderboard:" });
  const users = await Promise.all(
    list.keys.map(async (key) => {
      const data = await kv.get(key.name);
      return data ? JSON.parse(data) : null;
    })
  );

  return users
    .filter((u) => u !== null)
    .sort((a, b) => b.xu - a.xu)
    .slice(0, limit);
}

function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

async function transferToHouse(amount: number, kv: KVNamespace) {
  const houseData = await getUserData(HOUSE_USER_ID, kv);
  houseData.xu += amount;
  await saveUserData(HOUSE_USER_ID, houseData, kv);
}

app.command("xu", async (c) => {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  const userData = await getUserData(userId, c.env.GAME_DB);

  // Update username
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  if (!userData.username || userData.username !== username) {
    userData.username = username;
    await saveUserData(userId, userData, c.env.GAME_DB);
    await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);
  }

  return c.res({
    content: `Bạn hiện có **${userData.xu} xu**`,
    flags: 64, // Ephemeral
  });
});

app.command("lucky", async (c) => {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  const userData = await getUserData(userId, c.env.GAME_DB);
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (userData.lastLucky && now - userData.lastLucky < oneDay) {
    const timeLeft = oneDay - (now - userData.lastLucky);
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    return c.res({
      content: `Bạn đã nhận xu hôm nay rồi!\nThời gian còn lại: **${hoursLeft} giờ ${minutesLeft} phút**`,
      flags: 64,
    });
  }

  const luckyAmount = Math.floor(Math.random() * 101); // 0-100
  userData.xu += luckyAmount;
  userData.lastLucky = now;

  // Update username and leaderboard
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  userData.username = username;
  await saveUserData(userId, userData, c.env.GAME_DB);
  await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);

  return c.res({
    content: `🍀 Lucky! Bạn nhận được **${luckyAmount} xu**\nTổng xu: **${userData.xu} xu**`,
  });
});

app.command("taixiu", async (c) => {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const choice = c.get("chon") as string;
  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);

  if (!choice || !betAmount || betAmount < 1 || isNaN(betAmount)) {
    return c.res({
      content: "❌ Vui lòng nhập đúng thông tin!",
      flags: 64,
    });
  }

  const userData = await getUserData(userId, c.env.GAME_DB);

  if (userData.xu < betAmount) {
    return c.res({
      content: `Bạn không đủ xu!`,
      flags: 64,
    });
  }

  const dice1 = rollDice();
  const dice2 = rollDice();
  const dice3 = rollDice();
  const total = dice1 + dice2 + dice3;

  const isTai = total >= 11 && total <= 17;
  const isXiu = total >= 4 && total <= 10;
  const isWin = (choice === "tai" && isTai) || (choice === "xiu" && isXiu);

  let resultText = `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = **${total}**\n`;
  resultText += `${isTai ? "**TÀI**" : "**XỈU**"}\n\n`;

  if (isWin) {
    userData.xu += betAmount;
    resultText += `**THẮNG!** +${betAmount} xu`;
  } else {
    userData.xu -= betAmount;
    resultText += `**THUA!** -${betAmount} xu`;
  }

  resultText += `\nTổng xu: **${userData.xu} xu**`;

  // Update username and leaderboard
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  userData.username = username;
  await saveUserData(userId, userData, c.env.GAME_DB);
  await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);

  return c.res({
    content: resultText,
  });
});

app.command("baucua", async (c) => {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const choice = c.get("chon") as string;
  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);

  if (!choice || !betAmount || betAmount < 1 || isNaN(betAmount)) {
    return c.res({
      content: "❌ Vui lòng nhập đúng thông tin!",
      flags: 64,
    });
  }

  const userData = await getUserData(userId, c.env.GAME_DB);

  if (userData.xu < betAmount) {
    return c.res({
      content: `Bạn không đủ xu!`,
      flags: 64,
    });
  }

  const animals = ["cua", "tom", "ca", "nai", "bau", "ga"];
  const animalEmojis: Record<string, string> = {
    cua: "🦀",
    tom: "🦐",
    ca: "🐟",
    nai: "🦌",
    bau: "🎃",
    ga: "🐓",
  };
  const animalNames: Record<string, string> = {
    cua: "Cua",
    tom: "Tôm",
    ca: "Cá",
    nai: "Nai",
    bau: "Bầu",
    ga: "Gà",
  };

  const roll1 = animals[Math.floor(Math.random() * animals.length)];
  const roll2 = animals[Math.floor(Math.random() * animals.length)];
  const roll3 = animals[Math.floor(Math.random() * animals.length)];

  const matches = [roll1, roll2, roll3].filter((r) => r === choice).length;

  let resultText = `Kết quả: ${animalEmojis[roll1]} ${animalEmojis[roll2]} ${animalEmojis[roll3]}\n`;
  resultText += `${animalNames[roll1]} - ${animalNames[roll2]} - ${animalNames[roll3]}\n\n`;
  resultText += `Bạn chọn: ${animalEmojis[choice]} ${animalNames[choice]}\n\n`;

  if (matches === 0) {
    userData.xu -= betAmount;
    resultText += `**THUA!** -${betAmount} xu`;
  } else {
    const winAmount = betAmount * matches;
    userData.xu += winAmount;
    resultText += `**THẮNG ${matches}x!** +${winAmount} xu`;
  }

  resultText += `\nTổng xu: **${userData.xu} xu**`;

  // Update username and leaderboard
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  userData.username = username;
  await saveUserData(userId, userData, c.env.GAME_DB);
  await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);

  return c.res({
    content: resultText,
  });
});

app.command("slot", async (c) => {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const betAmount = parseInt(c.get("cuoc") as string);

  if (!betAmount || betAmount < 1 || isNaN(betAmount)) {
    return c.res({
      content: "❌ Vui lòng nhập số xu hợp lệ!",
      flags: 64,
    });
  }

  const userData = await getUserData(userId, c.env.GAME_DB);

  if (userData.xu < betAmount) {
    return c.res({
      content: `❌ Bạn không đủ xu! (Có: **${userData.xu} xu**)`,
      flags: 64,
    });
  }

  const symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "⭐", "7️⃣"];
  const weights = [25, 20, 20, 15, 10, 8, 2];

  const rollSymbol = () => {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;

    for (let i = 0; i < symbols.length; i++) {
      random -= weights[i];
      if (random <= 0) return symbols[i];
    }
    return symbols[0];
  };

  const slot1 = rollSymbol();
  const slot2 = rollSymbol();
  const slot3 = rollSymbol();

  let resultText = `🎰 SLOT MACHINE\n\n`;
  resultText += `┃ ${slot1} ┃ ${slot2} ┃ ${slot3} ┃\n\n`;

  let winAmount = 0;
  let multiplier = 0;

  if (slot1 === slot2 && slot2 === slot3) {
    if (slot1 === "7️⃣") {
      multiplier = 50; // JACKPOT!
      resultText += `**JACKPOT! 7-7-7!**\n`;
    } else if (slot1 === "⭐") {
      multiplier = 20;
      resultText += `**SUPER WIN!**\n`;
    } else if (slot1 === "💎") {
      multiplier = 15;
      resultText += `**MEGA WIN!**\n`;
    } else {
      multiplier = 10;
      resultText += `**BIG WIN! 3 giống nhau!**\n`;
    }
  } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
    const matchSymbol =
      slot1 === slot2 ? slot1 : slot2 === slot3 ? slot2 : slot1;

    if (matchSymbol === "7️⃣") {
      multiplier = 8;
      resultText += `**GREAT! 2 số 7!**\n`;
    } else if (matchSymbol === "⭐") {
      multiplier = 5;
      resultText += `**WIN! 2 sao!**\n`;
    } else if (matchSymbol === "💎") {
      multiplier = 4;
      resultText += `**WIN! 2 kim cương!**\n`;
    } else {
      multiplier = 3;
      resultText += `**WIN! 2 giống nhau!**\n`;
    }
  } else if (slot1 === "💎" || slot2 === "💎" || slot3 === "💎") {
    multiplier = 2;
    resultText += `**Lucky! Có kim cương!**\n`;
  } else if (slot1 === "⭐" || slot2 === "⭐" || slot3 === "⭐") {
    multiplier = 1.5;
    resultText += `**Bonus! Có sao!**\n`;
  }

  if (multiplier > 0) {
    winAmount = Math.floor(betAmount * multiplier);
    userData.xu += winAmount;
    resultText += `**+${winAmount} xu** (x${multiplier})\n`;
  } else {
    userData.xu -= betAmount;
    resultText += `**THUA!** -${betAmount} xu\n`;
  }

  resultText += `\nTổng xu: **${userData.xu} xu**`;

  // Update username and leaderboard
  const username =
    c.interaction.member?.user.username ||
    c.interaction.user?.username ||
    "Unknown";
  userData.username = username;
  await saveUserData(userId, userData, c.env.GAME_DB);
  await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);

  return c.res({
    content: resultText,
  });
});

app.command("duangua", async (c) => {
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

  interface UmaInfo {
    id: string;
    name: string;
    emoji: string;
    speed: number;
    multiplier: number;
  }

  const umas: UmaInfo[] = [
    {
      id: "special_week",
      name: "Special Week",
      emoji: "<:special_week:1426674463457673296>",
      speed: 0.4,
      multiplier: 2,
    },
    {
      id: "tokai_teio",
      name: "Tokai Teio",
      emoji: "<:tokai_teio:1426674466456342710>",
      speed: 0.35,
      multiplier: 2.5,
    },
    {
      id: "kitasan_black",
      name: "Kitasan Black",
      emoji: "<:kitasan_black:1426674457312759869>",
      speed: 0.3,
      multiplier: 3,
    },
    {
      id: "oguri_cap",
      name: "Oguri Cap",
      emoji: "<:oguri_cap:1426674472265453829>",
      speed: 0.25,
      multiplier: 3.5,
    },
    {
      id: "tamamo_cross",
      name: "Tamamo Cross",
      emoji: "<:tamamo_cross:1426674469543612596>",
      speed: 0.2,
      multiplier: 4,
    },
    {
      id: "satono_diamond",
      name: "Satono Diamond",
      emoji: "<:satono_diamond:1426674460756545566>",
      speed: 0.15,
      multiplier: 4.5,
    },
    {
      id: "gold_ship",
      name: "Gold Ship",
      emoji: "<:gold_ship:1426674449910071438>",
      speed: 0.1,
      multiplier: 5,
    },
    {
      id: "haru_urara",
      name: "Haru Urara",
      emoji: "<:haru_urara:1426674452573323487>",
      speed: 0.05,
      multiplier: 6,
    },
  ];

  const positions = umas.map((uma) => ({
    ...uma,
    position: 0,
  }));

  const FINISH_LINE = 20;
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
      initialMsg += `Cược: **${betAmount} xu**\n\n`;
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
          updateMsg += `Cược: **${betAmount} xu**\n\n`;
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
});

app.command("top", async (c) => {
  const topUsers = await getTopUsers(c.env.GAME_DB, 10);

  if (topUsers.length === 0) {
    return c.res({
      content: "Chưa có dữ liệu người chơi!",
      flags: 64,
    });
  }

  let leaderboardText = `🏆 BẢNG XẾP HẠNG TOP 10\n\n`;

  topUsers.forEach((user, index) => {
    const medal =
      index === 0
        ? "🥇"
        : index === 1
        ? "🥈"
        : index === 2
        ? "🥉"
        : `${index + 1}.`;
    leaderboardText += `${medal} **${
      user.username
    }** - ${user.xu.toLocaleString()} xu\n`;
  });

  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (userId) {
    const allUsers = await getTopUsers(c.env.GAME_DB, 1000);
    const userRank = allUsers.findIndex((u) => u.userId === userId);

    if (userRank >= 10) {
      const userData = await getUserData(userId, c.env.GAME_DB);
      leaderboardText += `\n━━━━━━━━━━━━━━━\n`;
      leaderboardText += `**Bạn:** #${
        userRank + 1
      } - ${userData.xu.toLocaleString()} xu`;
    }
  }

  return c.res({
    content: leaderboardText,
  });
});

export default app;
