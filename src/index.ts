import { DiscordHono } from "discord-hono";
import type { Env } from "./types";

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

export default app;
