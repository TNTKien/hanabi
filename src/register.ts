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
  
  new Command("xu", "Xem số xu hiện tại của bạn")
];

register(
  commands,
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN
  // process.env.DISCORD_TEST_GUILD_ID,
);
