# [<img alt="Static Badge" src="https://img.shields.io/badge/H%C3%A2nbi%235588-Invite-blue?logo=discord">](https://discord.com/oauth2/authorize?client_id=1415887405478580265) ![](https://dcbadge.limes.pink/api/shield/559979358404608001?style=flat)

A Discord bot for playing some games. 100% vibe coding.

Got errors while playing? Kệ mẹ bạn or find me on discord.

## ⚠️ MIGRATION IN PROGRESS

🚧 **Đang migrate từ KV sang D1 Database**

Xem hướng dẫn migration chi tiết:
- 📋 [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) - Checklist theo dõi tiến độ
- 📖 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Hướng dẫn chi tiết từng bước
- 📊 [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Tổng quan migration

## Requirements

- [Bun](https://bun.sh) - JavaScript runtime
- [Cloudflare Account](https://cloudflare.com) - For deploying the bot
- Discord Application - Create at [Discord Developer Portal](https://discord.com/developers/applications)

## Installation Guide

### 1. Install dependencies

```bash
bun install
```

### 2. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and name your bot
3. Go to **Bot** tab, click **Reset Token** to get your token
4. Enable **Privileged Gateway Intents** if needed (Message Content Intent)
5. Go to **General Information** tab, copy **Application ID** and **Public Key**

### 3. Configure environment

Create a `.env` file in the root directory:

```bash
DISCORD_APPLICATION_ID=your_application_id
DISCORD_TOKEN=your_bot_token
DISCORD_PUBLIC_KEY=your_public_key
```

### 4. Configure Cloudflare

#### 4.1. Login to Cloudflare

```bash
wrangler login
```

#### 4.2. Create D1 Database (NEW - Recommended)

```bash
# Create D1 database
bunx wrangler d1 create hanabi-db

# Generate migrations
bun run db:generate

# Apply migrations
bun run db:migrate
```

#### 4.3. (Legacy) Create KV namespace

```bash
wrangler kv:namespace create "GAME_DB"
```

Save the returned **id** and update it in `wrangler.jsonc`:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "GAME_DB",
      "id": "your_kv_namespace_id"
    }
  ]
}
```

#### 4.3. Configure environment variables

Edit `wrangler.jsonc`, in the `vars` section:

```jsonc
{
  "vars": {
    "LOG_GUILD_ID": "your_discord_server_id",
    "LOG_CHANNEL_ID": "your_log_channel_id",
    "HOUSE_USER_ID": "your_user_id"
  }
}
```

- **LOG_GUILD_ID**: Discord server ID for logging
- **LOG_CHANNEL_ID**: Channel ID for logging commands
- **HOUSE_USER_ID**: User ID of the house/banker (used for `/nap` command)

### 5. Register Discord commands

```bash
bun run register
```

This command will register all slash commands to Discord.

### 6. Deploy the bot

```bash
bun run deploy
```

### 7. Update Interactions Endpoint URL

1. Go back to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **General Information** tab
4. In **Interactions Endpoint URL**, enter:
   ```
   https://your-worker-name.your-subdomain.workers.dev/interactions
   ```
5. Click **Save Changes**

### 8. Invite bot to your server

Create an invite link in Installation section on the Discord Developer Portal.
Make sure to grant necessary scopes and permissions: `applications.commands`, `bot` and `Send Messages`.


You will get something like this:
```
https://discord.com/oauth2/authorize?client_id=YOUR_APPLICATION_ID
```

## Development Commands

- `bun run register` - Register slash commands
- `bun run deploy` - Deploy bot to Cloudflare Workers
- `bun run dev` - Run bot in development mode (if available)

## Notes

- Bot uses Cloudflare Workers, making it completely serverless
- Game data is stored in Cloudflare KV
- After updating code, you need to run `bun run deploy` again
- If you add/modify commands, run `bun run register` before deploying
- You can go to Cloudflare Dashboard instead of using CLI. Use `Import` while creating a new Worker to automatically deploy from your repository.