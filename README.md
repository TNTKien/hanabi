# Hanabi 

```bash
bun install
```
## .env

```bash
DISCORD_APPLICATION_ID=your_app_id
DISCORD_TOKEN=your_bot_token
DISCORD_PUBLIC_KEY=your_public_key
```

## Cloudflare

```bash
wrangler login
wrangler kv:namespace create "GAME_DB"
```
## Register commands

```bash
bun run register
```

## Deploy

```bash
bun run deploy
```