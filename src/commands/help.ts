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

**📊 Xếp hạng:**
• \`/top\` - Xem bảng xếp hạng

**❓ Trợ giúp:**
• \`/help <command>\` - Xem hướng dẫn chi tiết từng lệnh

**Ví dụ:**
• \`/help duangua\` - Xem hướng dẫn game đua ngựa
• \`/help slot\` - Xem hướng dẫn slot machine

`,
      flags: 64,
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
    flags: 64,
  });
}
