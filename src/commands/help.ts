import type { CommandContext } from "discord-hono";
import type { Env } from "../types";

export async function helpCommand(c: CommandContext<{ Bindings: Env }>) {
  // @ts-ignore
  const command = c.get("command") as string | undefined;

  // Help information for each command
  const helpInfo: Record<string, string> = {
    xu: `**📊 Lệnh /xu - Xem số xu**
    
Xem số xu hiện tại của bạn.

**Cách dùng:**
\`/xu\`

**Ví dụ:**
• \`/xu\` → Hiển thị: "Bạn hiện có **1000 xu**"`,

    lucky: `**🍀 Lệnh /lucky - Nhận xu hàng ngày**
    
Nhận xu miễn phí mỗi ngày (0-100 xu random).

**Cách dùng:**
\`/lucky\`

**Lưu ý:**
• Chỉ nhận được 1 lần mỗi 24 giờ
• Số xu random từ 0-100
• Thời gian cooldown hiển thị nếu đã claim

**Ví dụ:**
• \`/lucky\` → "🍀 Lucky! Bạn nhận được **75 xu**"`,

    taixiu: `**🎲 Lệnh /taixiu - Tài Xỉu**
    
Cược tài xỉu với 3 xúc xắc.

**Cách dùng:**
\`/taixiu <chon> <cuoc>\`

**Tham số:**
• \`chon\`: Chọn "tai" (11-17) hoặc "xiu" (4-10)
• \`cuoc\`: Số xu muốn cược (phải > 0)

**Thắng/Thua:**
• Thắng: Nhận x2 số xu đã cược
• Thua: Mất số xu đã cược

**Ví dụ:**
• \`/taixiu tai 100\` → Cược 100 xu vào TÀI
• \`/taixiu xiu 50\` → Cược 50 xu vào XỈU`,

    baucua: `**🎃 Lệnh /baucua - Bầu Cua**
    
Cược vào 1 trong 6 con vật với 3 xúc xắc.

**Cách dùng:**
\`/baucua <chon> <cuoc>\`

**Tham số:**
• \`chon\`: Chọn 1 trong 6 con: cua 🦀, tom 🦐, ca 🐟, nai 🦌, bau 🎃, ga 🐓
• \`cuoc\`: Số xu muốn cược (phải > 0)

**Thắng/Thua:**
• Trúng 1 con: x1 (nhận lại tiền cược)
• Trúng 2 con: x2 (gấp đôi)
• Trúng 3 con: x3 (gấp ba!)
• Không trúng: Mất tiền cược

**Ví dụ:**
• \`/baucua cua 100\` → Cược 100 xu vào con CUA`,

    slot: `**🎰 Lệnh /slot - Slot Machine**
    
Quay slot machine với 7 biểu tượng khác nhau.

**Cách dùng:**
\`/slot <cuoc>\`

**Tham số:**
• \`cuoc\`: Số xu muốn cược (phải > 0)

**Biểu tượng & Tỉ lệ thắng:**
• 7️⃣7️⃣7️⃣ = x50 (JACKPOT!)
• ⭐⭐⭐ = x20 (SUPER WIN!)
• 💎💎💎 = x15 (MEGA WIN!)
• 3 giống nhau = x10
• 2 số 7 = x8
• 2 sao = x5
• 2 kim cương = x4
• 2 giống nhau = x3
• Có 1 kim cương = x2
• Có 1 sao = x1.5

**Ví dụ:**
• \`/slot 100\` → Quay slot với 100 xu`,

    duangua: `**🏇 Lệnh /duangua - Uma Musume**

**Cách dùng:**
\`/duangua <uma> <cuoc>\`

**Tham số:**
• \`uma\`: Chọn 1 mã nương (Special Week, Tokai Teio, Gold Ship...)
• \`cuoc\`: Số xu muốn cược (phải > 0)

**Các chỉ số của mã nương:**
• 🏃‍♀️ Speed (400-1200): Tốc độ di chuyển
• 💪 Stamina (400-1200): Sức bền, giảm dần trong race
• ⚡ Power (400-1200): Khả năng bứt tốc
• 💃 Guts (400-1200): Tinh thần, mạnh cuối race
• 💡 Wisdom (400-1200): Trí tuệ, hồi stamina

**Tỷ lệ cược:**
• Stats cao → Tỷ lệ thấp (x2) - dễ thắng
• Stats thấp → Tỷ lệ cao (x6) - khó thắng, thưởng lớn

**Thể lực:**
• 💪 = Khỏe (>50%)
• 😮 = Mệt (20-50%)
• 💨 = Kiệt sức (<20%)

**Ví dụ:**
• \`/duangua gold_ship 100\` → Cược 100 xu vào Gold Ship`,

    top: `**🏆 Lệnh /top - Leaderboard**
    
Xem bảng xếp hạng top 10 người chơi giàu nhất.

**Cách dùng:**
\`/top\`

**Thông tin hiển thị:**
• Top 10 người chơi có nhiều xu nhất
• Vị trí của bạn (nếu không trong top 10)
• Số xu của mỗi người

**Huy chương:**
• 🥇 - Hạng 1
• 🥈 - Hạng 2
• 🥉 - Hạng 3

**Ví dụ:**
• \`/top\` → Hiển thị bảng xếp hạng`,

    box: `**🎁 Lệnh /box - Mystery Box**
    
Mở hộp bí ẩn để nhận xu ngẫu nhiên! Có thể nhận được buff hoặc bị nổ!

**Cách dùng:**
\`/box\`

**Cooldown:**
• 8 giờ mỗi lần (3 hộp mỗi ngày)

**Phần thưởng:**
• 80% thường: +100 đến +2,000 xu
• 10.5% hiếm: +1,000 đến +5,000 xu
• 4.5% boom: -50 đến -500 xu (hộp nổ!)
• 5% jackpot: +1,000 đến +3,000 xu + **buff x2** cho game tiếp theo!

**Buff x2:**
• Khi có buff, thắng game bất kỳ sẽ được nhân đôi phần thưởng!
• Buff dùng 1 lần và hết

**Ví dụ:**
• \`/box\` → Mở hộp may mắn
• Nhận 2000 xu + buff x2 → Chơi slot thắng 500 xu → Thực nhận 1000 xu!`,

    cauca: `**🎣 Lệnh /cauca - Fishing**
    
Câu cá để kiếm xu! Thu thập đủ 9 loài cá khác nhau!

**Cách dùng:**
\`/cauca\`

**Cooldown:**
• 90 giây mỗi lần (1 phút 30 giây)

**Các loài cá:**
• ⚪ Common (70%): +100 đến +500 xu
  - 🐟 Cá Rô, 🐠 Cá Chép, 🐡 Cá Nóc

• 🔵 Rare (25%): +500 đến +1,500 xu
  - 🐟 Cá Hồi, 🐠 Cá Ngừ

• 🟣 Epic (4%): +1,500 đến +5,000 xu
  - 🐡 Cá Mập, 🦈 Cá Mập Trắng

• 🟡 Legendary (1%): +5,000 đến +20,000 xu
  - 🐋 Cá Voi, 🐉 Rồng Biển

**Bộ sưu tập:**
• Track số lượng từng loài cá đã câu được
• Hiển thị tổng số loài unique và tổng số cá

**Ví dụ:**
• \`/cauca\` → Câu cá
• \`🟡 Bạn câu được: 🐋 Cá Voi\` → +15,000 xu!`,
  };

  // If no command selected, show general help
  if (!command) {
    return c.res({
      content: `**Danh sách các lệnh**

**💰 Quản lý Xu:**
• \`/xu\` - Xem số xu hiện tại
• \`/lucky\` - Nhận xu miễn phí mỗi ngày

**🎲 Trò chơi:**
• \`/taixiu\` - Game tài xỉu
• \`/baucua\` - Game bầu cua
• \`/slot\` - Slot machine
• \`/duangua\` - Đua ngựa Uma Musume

**🎁 Kiếm Xu Miễn Phí:**
• \`/box\` - Mở hộp bí ẩn (8h/lần)
• \`/cauca\` - Câu cá kiếm xu (90s/lần)

**📊 Xếp hạng:**
• \`/top\` - Xem bảng xếp hạng

**❓ Trợ giúp:**
• \`/help <command>\` - Xem hướng dẫn chi tiết từng lệnh

**Ví dụ:**
• \`/help duangua\` - Xem hướng dẫn game đua ngựa
• \`/help cauca\` - Xem hướng dẫn câu cá

`,
      // flags: 64,
    });
  }

  // Show specific command help
  const help = helpInfo[command];
  if (!help) {
    return c.res({
      content: `❌ Không tìm thấy hướng dẫn cho lệnh này!\n\nSử dụng \`/help\` để xem danh sách lệnh.`,
      flags: 64,
    });
  }

  return c.res({
    content: help,
    // flags: 64,
  });
}
