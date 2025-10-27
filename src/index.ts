import { DiscordHono } from "discord-hono";
import { Hono } from "hono";
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

// Create main Hono app
const app = new Hono<{ Bindings: Env }>();

// Create Discord Hono instance for interactions
const discord = new DiscordHono<{ Bindings: Env }>();

// Register all commands
discord.command("xu", xuCommand);
discord.command("lucky", luckyCommand);
discord.command("taixiu", taixiuCommand);
discord.command("baucua", baucuaCommand);
discord.command("slot", slotCommand);
discord.command("duangua", duanguaCommand);
discord.command("top", topCommand);
discord.command("help", helpCommand);
discord.command("nap", napCommand);
discord.command("box", boxCommand);
discord.command("cauca", caucaCommand);
discord.command("gacha", gachaCommand);
discord.command("banner", bannerCommand);
discord.command("chuyenxu", chuyenxuCommand);

// Handle component interactions (Select Menu)
discord.component("help_select", async (c) => {
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
        { name: "📖 Ví dụ", value: "`/xu` → Hiển thị số xu hiện tại" },
      ],
    },
    lucky: {
      title: "🍀 Lệnh /lucky - Nhận xu hàng ngày",
      description: "Nhận xu miễn phí mỗi ngày (0-10000 xu random).",
      color: 0x57f287,
      fields: [
        { name: "📝 Cách dùng", value: "`/lucky`" },
        { name: "⏰ Cooldown", value: "24 giờ", inline: true },
        { name: "💰 Reward", value: "0-10000 xu", inline: true },
      ],
    },
    taixiu: {
      title: "🎲 Lệnh /taixiu - Tài Xỉu",
      description: "Cược tài xỉu với 3 xúc xắc.",
      color: 0xed4245,
      fields: [
        { name: "📝 Cách dùng", value: "`/taixiu <chon> <cuoc>`" },
        {
          name: "🎯 Tài (11-17)",
          value: "Tổng 3 xúc xắc từ 11-17",
          inline: true,
        },
        {
          name: "🎯 Xỉu (4-10)",
          value: "Tổng 3 xúc xắc từ 4-10",
          inline: true,
        },
        { name: "💎 Thắng", value: "x2 số xu cược", inline: false },
        { name: "💔 Thua", value: "Mất tiền cược", inline: true },
      ],
    },
    baucua: {
      title: "🎃 Lệnh /baucua - Bầu Cua",
      description: "Cược vào 1 trong 6 con vật với 3 xúc xắc.",
      color: 0xfee75c,
      fields: [
        { name: "📝 Cách dùng", value: "`/baucua <chon> <cuoc>`" },
        {
          name: "🎯 6 Con vật",
          value: "🦀 Cua | 🦐 Tôm | 🐟 Cá\n🦌 Nai | 🎃 Bầu | 🐓 Gà",
        },
        { name: "💰 Thưởng", value: "1 con: x1 | 2 con: x2 | 3 con: x3" },
      ],
    },
    slot: {
      title: "🎰 Lệnh /slot - Slot Machine",
      description: "Quay slot machine với 7 biểu tượng khác nhau.",
      color: 0xeb459e,
      fields: [
        { name: "📝 Cách dùng", value: "`/slot <cuoc>`" },
        {
          name: "🎰 Jackpots",
          value: "7️⃣7️⃣7️⃣ = x50 | ⭐⭐⭐ = x20 | 💎💎💎 = x15",
          inline: false,
        },
        { name: "💰 Khác", value: "Chơi đi rồi biết", inline: false },
      ],
    },
    duangua: {
      title: "🏇 Lệnh /duangua - Uma Musume",
      description: "HASHIRE HASHIRE UMAMUSUME 🗣️🗣️",
      color: 0xff69b4,
      fields: [
        { name: "📝 Cách dùng", value: "`/duangua <uma> <cuoc>`" },
        {
          name: "⚡ 5 Stats",
          value: "🏃‍♀️ Speed - 💪 Stamina - ⚡ Power - 💃 Guts - 💡 Wisdom",
        },
        {
          name: "🏆 Phần thưởng",
          value: "🥇 1st: Full | 🥈 2nd: 50% | 🥉 3rd: 25%",
        },
      ],
    },
    box: {
      title: "🎁 Lệnh /box - Mystery Box",
      description: "Mở hộp bí ẩn để nhận xu ngẫu nhiên!",
      color: 0xf26522,
      fields: [
        { name: "⏰ Cooldown", value: "8 giờ (3 hộp/ngày)" },
        {
          name: "💰 Phần thưởng",
          value:
            "80% thường: +100-2,000\n10.5% hiếm: +1,000-5,000\n4.5% boom: -50-500\n5% jackpot: +1,000-3,000 + buff x2",
        },
      ],
    },
    cauca: {
      title: "🎣 Lệnh /cauca - Fishing",
      description: "Câu cá để kiếm xu! Thu thập 9 loài cá!",
      color: 0x3498db,
      fields: [
        { name: "⏰ Cooldown", value: "90 giây (1m30s)" },
        {
          name: "🐟 Các loài cá",
          value:
            "⚪ Common (70%): +100-500\n🔵 Rare (25%): +500-1,500\n🟣 Epic (4%): +1,500-5,000\n🟡 Legendary (1%): +5,000-20,000",
        },
      ],
    },
    gacha: {
      title: "🎰 Lệnh /gacha - Gacha System",
      description: "Gacha Oaifu, tạm thời có mỗi Bulul Archive",
      color: 0x9b59b6,
      fields: [
        { name: "📝 Cách dùng", value: "`/gacha blue_archive`" },
        { name: "💰 Cost", value: "1,200 xu cho 10 rolls", inline: true },
        { name: "🎯 Guaranteed", value: "Ít nhất 1 SR+", inline: true },
        {
          name: "📊 Tỷ lệ",
          value: "🟦 R: 78.5% | 🟨 SR: 18.5% | 🟪 SSR: 1.5%",
        },
        { name: "⭐ Rate-Up", value: "Nhân vật banner có tỷ lệ x2!" },
      ],
    },
    banner: {
      title: "⭐ Lệnh /banner - Rate-Up Banner",
      description: "Xem nhân vật đang được rate-up!",
      color: 0xe91e63,
      fields: [
        { name: "📝 Cách dùng", value: "`/banner blue_archive`" },
        { name: "🔄 Rotation", value: "Banner đổi mỗi 24 giờ", inline: true },
        { name: "⭐ Rate-Up", value: "Tỷ lệ nhận x2!", inline: true },
      ],
    },
    top: {
      title: "🏆 Lệnh /top - Leaderboard",
      description: "Xem bảng xếp hạng top 10 người chơi giàu nhất!",
      color: 0xffd700,
      fields: [
        { name: "📝 Cách dùng", value: "`/top`" },
        { name: "🏅 Huy chương", value: "🥇 Hạng 1 | 🥈 Hạng 2 | 🥉 Hạng 3" },
      ],
    },
    chuyenxu: {
      title: "💸 Lệnh /chuyenxu - Transfer",
      description: "Chuyển xu cho người chơi khác!",
      color: 0x2ecc71,
      fields: [
        { name: "📝 Cách dùng", value: "`/chuyenxu <người_nhận> <số_xu>`" },
        { name: "💰 Tối thiểu", value: "100 xu", inline: true },
        { name: "💰 Tối đa", value: "100,000,000 xu", inline: true },
        {
          name: "⚠️ Lưu ý",
          value:
            "• Không thể chuyển cho chính mình\n• Không thể chuyển cho người bị blacklist\n• Người nhận không được vượt quá giới hạn xu",
        },
      ],
    },
  };

  const embed = embeds[selectedCommand];

  if (!embed) {
    return c.res({
      content: "❌ Không tìm thấy hướng dẫn cho lệnh này!",
      flags: 64,
    });
  }

  // Update the message with the selected command's embed
  return c.res({
    embeds: [embed],
  });
});

// Terms of Service page
app.get("/terms-of-service", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Hânbi</title>
  <style>
    :root {
      --bg-color: #1a1a2e;
      --text-color: #eee;
      --heading-color: #f39c12;
      --link-color: #3498db;
      --section-bg: #16213e;
      --border-color: #2c3e50;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    
    h1 {
      text-align: center;
      color: var(--heading-color);
      border-bottom: 3px solid var(--heading-color);
      padding-bottom: 15px;
      margin-bottom: 10px;
    }
    
    h2 {
      color: var(--heading-color);
      margin-top: 30px;
      border-left: 4px solid var(--heading-color);
      padding-left: 15px;
    }
    
    h3 {
      color: var(--link-color);
      margin-top: 20px;
    }
    
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .update-date {
      color: #95a5a6;
      font-style: italic;
      flex: 1;
      text-align: center;
    }
    
    .lang-switch {
      background: var(--section-bg);
      border: 2px solid var(--heading-color);
      color: var(--heading-color);
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: bold;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .lang-switch:hover {
      background: var(--heading-color);
      color: var(--bg-color);
      transform: translateY(-2px);
    }
    
    .lang-switch:active {
      transform: translateY(0);
    }
    
    .section {
      background: var(--section-bg);
      padding: 25px;
      margin: 20px 0;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    
    .divider {
      border: 0;
      height: 2px;
      background: linear-gradient(to right, transparent, var(--border-color), transparent);
      margin: 30px 0;
    }
    
    a {
      color: var(--link-color);
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    strong {
      color: var(--heading-color);
    }
    
    ul, ol {
      margin-left: 20px;
    }
    
    li {
      margin: 8px 0;
    }
    
    code {
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    
    .lang-content {
      display: none;
    }
    
    .lang-content.active {
      display: block;
    }
    
    @media (max-width: 600px) {
      .header-container {
        flex-direction: column;
      }
      
      .update-date {
        order: 2;
      }
      
      .lang-switch {
        order: 1;
        width: 100%;
        justify-content: center;
      }
    }
  </style>
</head>
<body>
  <h1>Terms of Service</h1>
  
  <div class="header-container">
    <div style="flex: 0;"></div>
    <p class="update-date"><strong>Last updated:</strong> October 27, 2025</p>
    <button class="lang-switch" onclick="toggleLanguage()">
      <span id="lang-icon">🇻🇳</span>
      <span id="lang-text">Tiếng Việt</span>
    </button>
  </div>

  <hr class="divider">

  <!-- Vietnamese Version -->
  <div id="vi-content" class="lang-content">
    <div class="section">
      <p>Chào mừng bạn đến với <strong>Hânbi</strong> ("Hânbi"). Khi sử dụng bot, bạn đồng ý với các điều khoản sau:</p>

      <h3>1. Mô tả dịch vụ</h3>
      <p>Hânbi là bot trò chơi giải trí trên Discord, với đơn vị ảo là <strong>"Xu"</strong>.<br>
      "Xu" <strong>không có giá trị quy đổi ra tiền thật</strong>, không thể mua, bán và chỉ dùng trong phạm vi các trò chơi.</p>

      <h3>2. Tuân thủ</h3>
      <p>Bạn phải tuân thủ <a href="https://discord.com/terms" target="_blank">Điều khoản Dịch vụ của Discord</a> và <a href="https://discord.com/guidelines" target="_blank">Nguyên tắc Cộng đồng</a>.<br>
      Không được sử dụng bot cho mục đích phi pháp, spam, lừa đảo, quấy rối, hoặc phá hoại máy chủ.</p>

      <h3>3. Dữ liệu người dùng</h3>
      <p>Chúng tôi chỉ lưu trữ các thông tin kỹ thuật cần thiết để vận hành bot như:</p>
      <ul>
        <li>Discord User ID, Guild ID, Channel ID, username</li>
        <li>Số lượng Xu, lịch sử sử dụng lệnh, cài đặt trong bot</li>
      </ul>
      <p>Chúng tôi <strong>không</strong> lưu hoặc yêu cầu thông tin cá nhân (họ tên, email, số điện thoại, v.v.).</p>

      <h3>4. Tính sẵn sàng</h3>
      <p>Bot có thể tạm ngưng, ngừng hoạt động hoặc thay đổi bất kỳ lúc nào mà không cần báo trước.</p>

      <h3>5. Miễn trừ trách nhiệm</h3>
      <p>Dịch vụ được cung cấp "nguyên trạng" (as is).<br>
      Chúng tôi không chịu trách nhiệm với thiệt hại trực tiếp, gián tiếp hoặc mất mát dữ liệu phát sinh từ việc sử dụng bot.</p>

      <h3>6. Nguồn mở</h3>
      <p>Mã nguồn bot được công khai tại: <a href="https://github.com/TNTKien/hanabi" target="_blank">https://github.com/TNTKien/hanabi</a>.<br>
      Việc truy cập mã nguồn không cấp quyền sở hữu hoặc thương mại hóa dịch vụ.</p>

      <h3>7. Liên hệ</h3>
      <p>Mọi thắc mắc: <a href="mailto:support@mail.suicaodex.com">support@mail.suicaodex.com</a></p>
    </div>
  </div>

  <!-- English Version -->
  <div id="en-content" class="lang-content active">
    <div class="section">
      <p>Welcome to <strong>Hânbi</strong> ("Hânbi"). By using this bot, you agree to the following terms:</p>

      <h3>1. Description</h3>
      <p>Hânbi is a Discord entertainment bot using the virtual currency <strong>"Xu"</strong>, which <strong>has no real-world monetary value</strong> and cannot be bought/sold. It is used only for in-games.</p>

      <h3>2. Compliance</h3>
      <p>You must comply with <a href="https://discord.com/terms" target="_blank">Discord's Terms of Service</a> and <a href="https://discord.com/guidelines" target="_blank">Community Guidelines</a>.<br>
      You may not use the bot for illegal, spam, harassing, or disruptive purposes.</p>

      <h3>3. User Data</h3>
      <p>We only store technical identifiers and bot-related data:</p>
      <ul>
        <li>Discord User ID, Guild ID, Channel ID, username</li>
        <li>Xu balance, command history, in-bot settings</li>
      </ul>
      <p>We <strong>do not</strong> store or request personal data such as names, emails, or phone numbers.</p>

      <h3>4. Availability</h3>
      <p>The Service may be suspended or modified at any time without notice.</p>

      <h3>5. Liability</h3>
      <p>The Service is provided "as is."<br>
      We are not responsible for damages or data loss caused by the use of the bot.</p>

      <h3>6. Open Source</h3>
      <p>The bot's source code is publicly available at: <a href="https://github.com/TNTKien/hanabi" target="_blank">https://github.com/TNTKien/hanabi</a>.<br>
      Access to the source does not grant ownership or commercial rights.</p>

      <h3>7. Contact</h3>
      <p>For questions, contact: <a href="mailto:support@mail.suicaodex.com">support@mail.suicaodex.com</a></p>
    </div>
  </div>

  <script>
    let currentLang = 'en';
    
    function toggleLanguage() {
      const viContent = document.getElementById('vi-content');
      const enContent = document.getElementById('en-content');
      const langIcon = document.getElementById('lang-icon');
      const langText = document.getElementById('lang-text');
      const pageTitle = document.querySelector('h1');
      const updateDate = document.querySelector('.update-date');
      const htmlTitle = document.querySelector('title');
      
      if (currentLang === 'vi') {
        viContent.classList.remove('active');
        enContent.classList.add('active');
        langIcon.textContent = '🇻🇳';
        langText.textContent = 'Tiếng Việt';
        pageTitle.textContent = 'Terms of Service';
        updateDate.innerHTML = '<strong>Last updated:</strong> October 27, 2025';
        htmlTitle.textContent = 'Terms of Service - Hânbi';
        currentLang = 'en';
        document.documentElement.lang = 'en';
      } else {
        enContent.classList.remove('active');
        viContent.classList.add('active');
        langIcon.textContent = '🇺🇸';
        langText.textContent = 'English';
        pageTitle.textContent = 'Điều khoản Dịch vụ';
        updateDate.innerHTML = '<strong>Cập nhật lần cuối:</strong> 27/10/2025';
        htmlTitle.textContent = 'Điều khoản Dịch vụ - Hânbi';
        currentLang = 'vi';
        document.documentElement.lang = 'vi';
      }
      
      // Save preference to localStorage
      localStorage.setItem('preferredLang', currentLang);
    }
    
    // Load saved language preference
    window.addEventListener('DOMContentLoaded', () => {
      const savedLang = localStorage.getItem('preferredLang');
      if (savedLang && savedLang !== currentLang) {
        toggleLanguage();
      }
    });
  </script>
</body>
</html>`;

  return c.html(html);
});

// Privacy Policy page
app.get("/privacy-policy", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Hânbi</title>
  <style>
    :root {
      --bg-color: #1a1a2e;
      --text-color: #eee;
      --heading-color: #f39c12;
      --link-color: #3498db;
      --section-bg: #16213e;
      --border-color: #2c3e50;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    
    h1 {
      text-align: center;
      color: var(--heading-color);
      border-bottom: 3px solid var(--heading-color);
      padding-bottom: 15px;
      margin-bottom: 10px;
    }
    
    h2 {
      color: var(--heading-color);
      margin-top: 30px;
      border-left: 4px solid var(--heading-color);
      padding-left: 15px;
    }
    
    h3 {
      color: var(--link-color);
      margin-top: 20px;
    }
    
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .update-date {
      color: #95a5a6;
      font-style: italic;
      flex: 1;
      text-align: center;
    }
    
    .lang-switch {
      background: var(--section-bg);
      border: 2px solid var(--heading-color);
      color: var(--heading-color);
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: bold;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .lang-switch:hover {
      background: var(--heading-color);
      color: var(--bg-color);
      transform: translateY(-2px);
    }
    
    .lang-switch:active {
      transform: translateY(0);
    }
    
    .section {
      background: var(--section-bg);
      padding: 25px;
      margin: 20px 0;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    
    .divider {
      border: 0;
      height: 2px;
      background: linear-gradient(to right, transparent, var(--border-color), transparent);
      margin: 30px 0;
    }
    
    a {
      color: var(--link-color);
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    strong {
      color: var(--heading-color);
    }
    
    ul, ol {
      margin-left: 20px;
    }
    
    li {
      margin: 8px 0;
    }
    
    code {
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    
    .lang-content {
      display: none;
    }
    
    .lang-content.active {
      display: block;
    }
    
    @media (max-width: 600px) {
      .header-container {
        flex-direction: column;
      }
      
      .update-date {
        order: 2;
      }
      
      .lang-switch {
        order: 1;
        width: 100%;
        justify-content: center;
      }
    }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  
  <div class="header-container">
    <div style="flex: 0;"></div>
    <p class="update-date"><strong>Last updated:</strong> October 27, 2025</p>
    <button class="lang-switch" onclick="toggleLanguage()">
      <span id="lang-icon">🇻🇳</span>
      <span id="lang-text">Tiếng Việt</span>
    </button>
  </div>

  <hr class="divider">

  <!-- Vietnamese Version -->
  <div id="vi-content" class="lang-content">
    <div class="section">
      <h3>1. Dữ liệu thu thập</h3>
      <p>Bot chỉ thu thập thông tin cần thiết cho hoạt động:</p>
      <ul>
        <li>Discord User ID, Guild ID, Channel ID, username</li>
        <li>Số Xu, lịch sử sử dụng lệnh, thông số trò chơi</li>
        <li>Không thu thập dữ liệu cá nhân như họ tên, email, số điện thoại</li>
      </ul>

      <h3>2. Mục đích sử dụng</h3>
      <ul>
        <li>Vận hành và duy trì các tính năng trò chơi</li>
        <li>Cải thiện trải nghiệm người dùng và phòng chống gian lận</li>
        <li>Không bán hoặc chia sẻ dữ liệu cho bên thứ ba</li>
      </ul>

      <h3>3. Lưu trữ</h3>
      <p>Dữ liệu được lưu trên hệ thống hạ tầng bảo mật (ví dụ: Cloudflare Workers / D1 Database).<br>
      Các dữ liệu tạm thời có thể được xóa hoặc ghi đè định kỳ.</p>

      <h3>4. Quyền của người dùng</h3>
      <p>Bạn có thể yêu cầu xuất hoặc xóa dữ liệu liên quan đến tài khoản Discord của mình bằng cách gửi yêu cầu qua <a href="mailto:support@mail.suicaodex.com">support@mail.suicaodex.com</a>.</p>

      <h3>5. Nguồn mở</h3>
      <p>Mã nguồn bot được công bố tại <a href="https://github.com/TNTKien/hanabi" target="_blank">GitHub</a> nhằm minh bạch về cách xử lý dữ liệu.<br>
      Tuy nhiên, bản triển khai thực tế có thể bao gồm cấu hình riêng.</p>

      <h3>6. Thay đổi chính sách</h3>
      <p>Chính sách này có thể được cập nhật. Phiên bản mới nhất sẽ hiển thị tại trang này.</p>
    </div>
  </div>

  <!-- English Version -->
  <div id="en-content" class="lang-content active">
    <div class="section">
      <h3>1. Data We Collect</h3>
      <p>The bot only collects minimal technical data needed for operation:</p>
      <ul>
        <li>Discord User ID, Guild ID, Channel ID, username</li>
        <li>Xu balance, command usage, and gameplay data</li>
        <li>No personal data (name, email, phone) is collected</li>
      </ul>

      <h3>2. Purpose of Collection</h3>
      <ul>
        <li>To operate in-game features and maintain functionality</li>
        <li>To improve user experience and prevent abuse</li>
        <li>Data is <strong>not sold or shared</strong> with any third party</li>
      </ul>

      <h3>3. Storage</h3>
      <p>Data is stored on secure infrastructure (e.g. Cloudflare Workers / D1 Database).<br>
      Temporary data may be cleared or overwritten periodically.</p>

      <h3>4. User Rights</h3>
      <p>You may request access or deletion of your data by contacting us at <a href="mailto:support@mail.suicaodex.com">support@mail.suicaodex.com</a>.</p>

      <h3>5. Open Source</h3>
      <p>The bot's code is open-source at <a href="https://github.com/TNTKien/hanabi" target="_blank">GitHub</a> for transparency.<br>
      Live deployment may contain private configurations or limited features.</p>

      <h3>6. Policy Updates</h3>
      <p>This policy may be updated. The latest version will always be available on this page.</p>
    </div>
  </div>

  <script>
    let currentLang = 'en';
    
    function toggleLanguage() {
      const viContent = document.getElementById('vi-content');
      const enContent = document.getElementById('en-content');
      const langIcon = document.getElementById('lang-icon');
      const langText = document.getElementById('lang-text');
      const pageTitle = document.querySelector('h1');
      const updateDate = document.querySelector('.update-date');
      const htmlTitle = document.querySelector('title');
      
      if (currentLang === 'vi') {
        viContent.classList.remove('active');
        enContent.classList.add('active');
        langIcon.textContent = '🇻🇳';
        langText.textContent = 'Tiếng Việt';
        pageTitle.textContent = 'Privacy Policy';
        updateDate.innerHTML = '<strong>Last updated:</strong> October 27, 2025';
        htmlTitle.textContent = 'Privacy Policy - Hânbi';
        currentLang = 'en';
        document.documentElement.lang = 'en';
      } else {
        enContent.classList.remove('active');
        viContent.classList.add('active');
        langIcon.textContent = '🇺🇸';
        langText.textContent = 'English';
        pageTitle.textContent = 'Chính sách Bảo mật';
        updateDate.innerHTML = '<strong>Cập nhật lần cuối:</strong> 27/10/2025';
        htmlTitle.textContent = 'Chính sách Bảo mật - Hânbi';
        currentLang = 'vi';
        document.documentElement.lang = 'vi';
      }
      
      // Save preference to localStorage
      localStorage.setItem('preferredLangPrivacy', currentLang);
    }
    
    // Load saved language preference
    window.addEventListener('DOMContentLoaded', () => {
      const savedLang = localStorage.getItem('preferredLangPrivacy');
      if (savedLang && savedLang !== currentLang) {
        toggleLanguage();
      }
    });
  </script>
</body>
</html>`;

  return c.html(html);
});

// Handle all other routes with Discord interactions
app.all("*", (c) => discord.fetch(c.req.raw, c.env));

export default app;
