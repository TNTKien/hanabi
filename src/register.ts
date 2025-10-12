import { Command, Option, register } from "discord-hono";

const commands = [
  new Command("lucky", "Nhận xu may mắn mỗi ngày (0-100 xu)"),
  
  new Command("taixiu", "Chơi tài xỉu").options(
    new Option("chon", "Chọn Tài (11-17) hoặc Xỉu (4-10)")
      .choices(
        { name: "Tài", value: "tai" },
        { name: "Xỉu", value: "xiu" }
      )
      .required(),
    new Option("cuoc", "Số xu muốn cược", "Integer").required()
  ),
  
  new Command("baucua", "Chơi bầu cua tôm cá").options(
    new Option("chon", "Chọn con vật")
      .choices(
        { name: "🦀 Cua", value: "cua" },
        { name: "🦐 Tôm", value: "tom" },
        { name: "🐟 Cá", value: "ca" },
        { name: "🦌 Nai", value: "nai" },
        { name: "🎃 Bầu", value: "bau" },
        { name: "🐓 Gà", value: "ga" }
      )
      .required(),
    new Option("cuoc", "Số xu muốn cược", "Integer").required()
  ),
  
  new Command("slot", "Quay slot machine").options(
    new Option("cuoc", "Số xu muốn cược", "Integer").required()
  ),
  
  new Command("duangua", "Hashire hashire uma musume 🗣🗣🐎🐎").options(
    new Option("uma", "Chọn mã nương")
      .choices(
        { name: "Special Week", value: "special_week" },
        { name: "Tokai Teio", value: "tokai_teio" },
        { name: "Gold Ship", value: "gold_ship" },
        { name: "Kitasan Black", value: "kitasan_black" },
        { name: "Oguri Cap", value: "oguri_cap" },
        { name: "Tamamo Cross", value: "tamamo_cross" },
        { name: "Haru Urara", value: "haru_urara" },
        { name: "Satono Diamond", value: "satono_diamond" }
      )
      .required(),
    new Option("cuoc", "Số xu muốn cược", "Integer").required()
  ),
  
  new Command("top", "Xem bảng xếp hạng người chơi giàu nhất"),
  
  new Command("xu", "Xem số xu hiện tại của bạn"),
  
  new Command("help", "Hướng dẫn sử dụng bot").options(
    new Option("command", "Chọn lệnh để xem hướng dẫn")
      .choices(
        { name: "💰 /xu - Xem số xu", value: "xu" },
        { name: "🍀 /lucky - Nhận xu hàng ngày", value: "lucky" },
        { name: "🎲 /taixiu - Game tài xỉu", value: "taixiu" },
        { name: "🎃 /baucua - Game bầu cua", value: "baucua" },
        { name: "🎰 /slot - Game slot", value: "slot" },
        { name: "🏇 /duangua - Uma Musume", value: "duangua" },
        { name: "📦 /box - Hộp bí ẩn", value: "box" },
        { name: "🎣 /cauca - Câu cá", value: "cauca" },
        { name: "� /gacha - Gacha system", value: "gacha" },
        { name: "⭐ /banner - Rate-up banner", value: "banner" },
        { name: "�🏆 /top - Bảng xếp hạng", value: "top" }
      )
  ),
  
  new Command("nap", "Nạp xu cho người chơi (Chỉ nhà cái)").options(
    new Option("user", "Chọn người chơi cần nạp xu", "User").required(),
    new Option("amount", "Số xu muốn nạp", "Integer").required()
  ),
  
  new Command("box", "Mở hộp bí ẩn để nhận xu (8 giờ/lần)"),
  
  new Command("cauca", "Câu cá để kiếm xu (90 giây/lần)"),
  
  new Command("gacha", "Gacha nhân vật (1200 xu/10 rolls)").options(
    new Option("game", "Chọn game gacha")
      .choices({ name: "Blue Archive", value: "blue_archive" })
      .required()
  ),
  
  new Command("banner", "Xem banner rate-up hiện tại").options(
    new Option("game", "Chọn game")
      .choices({ name: "Blue Archive", value: "blue_archive" })
      .required()
  )
];

register(
  commands,
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN
  // process.env.DISCORD_TEST_GUILD_ID,
);
