```
src/
├── index.ts              # Entry point, register commands
├── types.ts              # Type definitions (UserData, Env, etc.)
├── commands/             # Commands folder
│   ├── xu.ts
│   ├── lucky.ts
│   ├── taixiu.ts
│   ├── baucua.ts
│   ├── slot.ts
│   ├── duangua.ts
│   └── ... (more commands)
    └── database.ts       # Database utilities (getUserData, saveUserData, etc.)
```

## New command

```typescript
// src/commands/newgame.ts
import type { CommandContext } from "discord-hono";
import type { Env } from "../types";
import { getUserData, saveUserData } from "../utils/database";

export async function newgameCommand(c: CommandContext<{ Bindings: Env }>) {
  const userId = c.interaction.member?.user.id || c.interaction.user?.id;
  if (!userId) return c.res("Không thể xác định người dùng!");

  const userData = await getUserData(userId, c.env.GAME_DB);

  // Your game logic here

  return c.res({
    content: "Game result",
  });
}
```

```typescript
import { newgameCommand } from "./commands/newgame";

app.command("newgame", newgameCommand);
```

```typescript
new Command("newgame", "Mô tả game mới").options(
  new Option("param1", "Tham số 1", "String").required()
),
```
