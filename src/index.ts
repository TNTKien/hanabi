import { DiscordHono } from "discord-hono";

const HOUSE_USER_ID = "559979358404608001"; // Change to your Discord User ID

interface UserData {
  xu: number;
  lastLucky?: number;
}

interface Env {
  GAME_DB: KVNamespace;
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
  await saveUserData(userId, userData, c.env.GAME_DB);

  return c.res({
    content: `Bạn nhận được **${luckyAmount} xu**!`,
  });
});

app.command("taixiu", async (c) => {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  // @ts-ignore
  const choice = c.get("chon") as string;
  // @ts-ignore
  const betAmount = parseInt(c.get("tien") as string);

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

  let resultText = `🎲 **Kết quả:** ${dice1} + ${dice2} + ${dice3} = **${total}**\n`;
  resultText += `${isTai ? "🔺 **TÀI**" : "🔻 **XỈU**"}\n\n`;

  if (isWin) {
    userData.xu += betAmount;
    resultText += `✅ **THẮNG!** +${betAmount} xu`;
  } else {
    userData.xu -= betAmount;
    await transferToHouse(betAmount, c.env.GAME_DB);
    resultText += `❌ **THUA!** -${betAmount} xu`;
  }

  await saveUserData(userId, userData, c.env.GAME_DB);

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
  const betAmount = parseInt(c.get("tien") as string);

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

  let resultText = `🎰 **Kết quả:** ${animalEmojis[roll1]} ${animalEmojis[roll2]} ${animalEmojis[roll3]}\n`;
  resultText += `${animalNames[roll1]} - ${animalNames[roll2]} - ${animalNames[roll3]}\n\n`;
  resultText += `Bạn chọn: ${animalEmojis[choice]} **${animalNames[choice]}**\n\n`;

  if (matches === 0) {
    userData.xu -= betAmount;
    await transferToHouse(betAmount, c.env.GAME_DB);
    resultText += `❌ **THUA!** -${betAmount} xu`;
  } else {
    const winAmount = betAmount * matches;
    userData.xu += winAmount;
    resultText += `✅ **THẮNG ${matches}x!** +${winAmount} xu`;
  }

  await saveUserData(userId, userData, c.env.GAME_DB);

  return c.res({
    content: resultText,
  });
});

export default app;
