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

export default app;
