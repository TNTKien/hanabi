import { Button, Components, DiscordHono } from "discord-hono";

const app = new DiscordHono()
  .command("hello", (c) => c.res(`Hello, ${c.var.name ?? "World"}!`))
  .command("help", (c) =>
    c.res({
      components: new Components().row(
        new Button("https://discord-hono.luis.fun", ["📑", "Docs"], "Link"),
        new Button("delete", ["🗑️", "Delete"])
      ),
    })
  )
  .command("ping", async (c) => {
    const startTime = Date.now();
    
    // Tính response time
    const responseTime = Date.now() - startTime;
    
    return c.res({
      embeds: [{
        title: "🏓 Pong!",
        color: 0x5865F2, // Discord blurple color
        fields: [
          {
            name: "📡 Latency",
            value: `${responseTime}ms`,
            inline: true,
          },
          {
            name: "⚡ Runtime",
            value: "Cloudflare Workers",
            inline: true,
          },
          {
            name: "🤖 Bot Status",
            value: "✅ Online",
            inline: true,
          },
          {
            name: "🌐 Edge Network",
            value: "Cloudflare Global",
            inline: true,
          },
          {
            name: "📊 Memory Usage",
            value: "Minimal (Serverless)",
            inline: true,
          },
          {
            name: "⏱️ Response Time",
            value: `${Date.now() - startTime}ms`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Hanabi Bot • Powered by Cloudflare Workers",
        },
      }],
    });
  })
  .component("delete", (c) => c.update().resDefer((c) => c.followup()));

export default app;

// Example to check next
// https://github.com/luisfun/discord-hono-examples/tree/main/workerd-use-factory
