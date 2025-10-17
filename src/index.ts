import { DiscordHono } from "discord-hono";
import type { Env } from "./types";
import { isBlacklisted, blacklistedResponse } from "./utils/blacklist";

// Import commands
import { xuCommand } from "./commands/xu";
import { luckyCommand } from "./commands/lucky";
import { taixiuCommand } from "./commands/taixiu";
import { baucuaCommand } from "./commands/baucua";
import { slotCommand } from "./commands/slot";
import { duanguaCommand } from "./commands/duangua";
import { topCommand } from "./commands/top";
import { helpCommand } from "./commands/help";
import { napCommand } from "./commands/nap";
import { boxCommand } from "./commands/box";
import { caucaCommand } from "./commands/cauca";
import { gachaCommand } from "./commands/gacha";
import { bannerCommand } from "./commands/banner";
import { chuyenxuCommand } from "./commands/chuyenxu";

const app = new DiscordHono<{ Bindings: Env }>();

// Register all commands
app.command("xu", xuCommand);
app.command("lucky", luckyCommand);
app.command("taixiu", taixiuCommand);
app.command("baucua", baucuaCommand);
app.command("slot", slotCommand);
app.command("duangua", duanguaCommand);
app.command("top", topCommand);
app.command("help", helpCommand);
app.command("nap", napCommand);
app.command("box", boxCommand);
app.command("cauca", caucaCommand);
app.command("gacha", gachaCommand);
app.command("banner", bannerCommand);
app.command("chuyenxu", chuyenxuCommand);

// Handle component interactions (Select Menu)
app.component("help_select", async (c) => {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (isBlacklisted(userId)) return c.res(blacklistedResponse());
  // Get selected value from interaction
  // @ts-ignore - Discord string select interaction
  const selectedCommand = c.interaction?.data?.values?.[0] as string;

  if (!selectedCommand) {
    return c.res({ content: "❌ Lỗi: Không tìm thấy lựa chọn!", flags: 64 });
  }

  // Get embed data for the selected command
  const embeds: Record<string, any> = {
    xu: {
      title: "💰 Lệnh /xu - Xem số xu",
      description: "Xem số xu hiện tại của bạn.",
      color: 0xffd700,
      fields: [
        { name: "📝 Cách dùng", value: "`/xu`" },
        { name: "📖 Ví dụ", value: "`/xu` → Hiển thị số xu hiện tại" }
      ]
    },
    lucky: {
      title: "🍀 Lệnh /lucky - Nhận xu hàng ngày",
      description: "Nhận xu miễn phí mỗi ngày (0-10000 xu random).",
      color: 0x57f287,
      fields: [
        { name: "📝 Cách dùng", value: "`/lucky`" },
        { name: "⏰ Cooldown", value: "24 giờ", inline: true },
        { name: "💰 Reward", value: "0-10000 xu", inline: true }
      ]
    },
    taixiu: {
      title: "🎲 Lệnh /taixiu - Tài Xỉu",
      description: "Cược tài xỉu với 3 xúc xắc.",
      color: 0xed4245,
      fields: [
        { name: "📝 Cách dùng", value: "`/taixiu <chon> <cuoc>`" },
        { name: "🎯 Tài (11-17)", value: "Tổng 3 xúc xắc từ 11-17", inline: true },
        { name: "🎯 Xỉu (4-10)", value: "Tổng 3 xúc xắc từ 4-10", inline: true },
        { name: "💎 Thắng", value: "x2 số xu cược", inline: false },
        { name: "💔 Thua", value: "Mất tiền cược", inline: true }
      ]
    },
    baucua: {
      title: "🎃 Lệnh /baucua - Bầu Cua",
      description: "Cược vào 1 trong 6 con vật với 3 xúc xắc.",
      color: 0xfee75c,
      fields: [
        { name: "📝 Cách dùng", value: "`/baucua <chon> <cuoc>`" },
        { name: "🎯 6 Con vật", value: "🦀 Cua | 🦐 Tôm | 🐟 Cá\n🦌 Nai | 🎃 Bầu | 🐓 Gà" },
        { name: "💰 Thưởng", value: "1 con: x1 | 2 con: x2 | 3 con: x3" }
      ]
    },
    slot: {
      title: "🎰 Lệnh /slot - Slot Machine",
      description: "Quay slot machine với 7 biểu tượng khác nhau.",
      color: 0xeb459e,
      fields: [
        { name: "📝 Cách dùng", value: "`/slot <cuoc>`" },
        { name: "🎰 Jackpots", value: "7️⃣7️⃣7️⃣ = x50 | ⭐⭐⭐ = x20 | 💎💎💎 = x15", inline: false },
        { name: "💰 Khác", value: "Chơi đi rồi biết", inline: false }
      ]
    },
    duangua: {
      title: "🏇 Lệnh /duangua - Uma Musume",
      description: "HASHIRE HASHIRE UMAMUSUME 🗣️🗣️",
      color: 0xff69b4,
      fields: [
        { name: "📝 Cách dùng", value: "`/duangua <uma> <cuoc>`" },
        { name: "⚡ 5 Stats", value: "🏃‍♀️ Speed - 💪 Stamina - ⚡ Power - 💃 Guts - 💡 Wisdom" },
        { name: "🏆 Phần thưởng", value: "🥇 1st: Full | 🥈 2nd: 50% | 🥉 3rd: 25%" }
      ]
    },
    box: {
      title: "🎁 Lệnh /box - Mystery Box",
      description: "Mở hộp bí ẩn để nhận xu ngẫu nhiên!",
      color: 0xf26522,
      fields: [
        { name: "⏰ Cooldown", value: "8 giờ (3 hộp/ngày)" },
        { name: "💰 Phần thưởng", value: "80% thường: +100-2,000\n10.5% hiếm: +1,000-5,000\n4.5% boom: -50-500\n5% jackpot: +1,000-3,000 + buff x2" }
      ]
    },
    cauca: {
      title: "🎣 Lệnh /cauca - Fishing",
      description: "Câu cá để kiếm xu! Thu thập 9 loài cá!",
      color: 0x3498db,
      fields: [
        { name: "⏰ Cooldown", value: "90 giây (1m30s)" },
        { name: "🐟 Các loài cá", value: "⚪ Common (70%): +100-500\n🔵 Rare (25%): +500-1,500\n🟣 Epic (4%): +1,500-5,000\n🟡 Legendary (1%): +5,000-20,000" }
      ]
    },
    gacha: {
      title: "🎰 Lệnh /gacha - Gacha System",
      description: "Gacha Oaifu, tạm thời có mỗi Bulul Archive",
      color: 0x9b59b6,
      fields: [
        { name: "📝 Cách dùng", value: "`/gacha blue_archive`" },
        { name: "💰 Cost", value: "1,200 xu cho 10 rolls", inline: true },
        { name: "🎯 Guaranteed", value: "Ít nhất 1 SR+", inline: true },
        { name: "📊 Tỷ lệ", value: "🟦 R: 78.5% | 🟨 SR: 18.5% | 🟪 SSR: 1.5%" },
        { name: "⭐ Rate-Up", value: "Nhân vật banner có tỷ lệ x2!" }
      ]
    },
    banner: {
      title: "⭐ Lệnh /banner - Rate-Up Banner",
      description: "Xem nhân vật đang được rate-up!",
      color: 0xe91e63,
      fields: [
        { name: "📝 Cách dùng", value: "`/banner blue_archive`" },
        { name: "🔄 Rotation", value: "Banner đổi mỗi 24 giờ", inline: true },
        { name: "⭐ Rate-Up", value: "Tỷ lệ nhận x2!", inline: true }
      ]
    },
    top: {
      title: "🏆 Lệnh /top - Leaderboard",
      description: "Xem bảng xếp hạng top 10 người chơi giàu nhất!",
      color: 0xffd700,
      fields: [
        { name: "📝 Cách dùng", value: "`/top`" },
        { name: "🏅 Huy chương", value: "🥇 Hạng 1 | 🥈 Hạng 2 | 🥉 Hạng 3" }
      ]
    },
    chuyenxu: {
      title: "💸 Lệnh /chuyenxu - Transfer",
      description: "Chuyển xu cho người chơi khác!",
      color: 0x2ecc71,
      fields: [
        { name: "📝 Cách dùng", value: "`/chuyenxu <người_nhận> <số_xu>`" },
        { name: "💰 Tối thiểu", value: "100 xu", inline: true },
        { name: "💰 Tối đa", value: "100,000,000 xu", inline: true },
        { name: "⚠️ Lưu ý", value: "• Không thể chuyển cho chính mình\n• Không thể chuyển cho người bị blacklist\n• Người nhận không được vượt quá giới hạn xu" }
      ]
    }
  };

  const embed = embeds[selectedCommand];

  if (!embed) {
    return c.res({ content: "❌ Không tìm thấy hướng dẫn cho lệnh này!", flags: 64 });
  }

  // Update the message with the selected command's embed
  return c.res({
    embeds: [embed]
  });
});

export default app;
