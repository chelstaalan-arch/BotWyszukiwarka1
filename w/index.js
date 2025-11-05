const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");
const express = require("express");

const TOKEN = process.env.BOT_TOKEN;
const DATA_DIR = path.join(__dirname, "players");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

async function loadAllPlayers() {
  const players = new Map();
  try {
    const files = await fs.readdir(DATA_DIR);
    for (const file of files) {
      if (!file.endsWith(".txt")) continue;
      const text = await fs.readFile(path.join(DATA_DIR, file), "utf8");
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const nick = parts.shift().toLowerCase();
        const stats = parts.map(Number);
        players.set(nick, { stats, file });
      }
    }
  } catch (err) {
    console.error("❌ Błąd przy wczytywaniu plików:", err);
  }
  return players;
}

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  const content = msg.content.trim();

  if (content.startsWith(".gracz ")) {
    const nick = content.slice(7).trim().toLowerCase();
    const players = await loadAllPlayers();
    const player = players.get(nick);

    if (!player) {
      msg.reply(`❌ Nie znaleziono gracza **${nick}** w żadnym pliku.`);
      return;
    }

    const { stats, file } = player;

    const embed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle(`📊 Statystyki gracza ${nick}`)
      .addFields(
        { name: "Stat 1", value: `${stats[0] ?? "—"}`, inline: true },
        { name: "Stat 2", value: `${stats[1] ?? "—"}`, inline: true },
        { name: "Stat 3", value: `${stats[2] ?? "—"}`, inline: true },
        { name: "Stat 4", value: `${stats[3] ?? "—"}`, inline: true }
      )
      .setFooter({ text: `📁 Dane z pliku: ${file}` })
      .setTimestamp();

    msg.reply({ embeds: [embed] });
  }
});

const app = express();
app.get("/", (req, res) => res.send("Bot działa!"));
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Keepalive serwer aktywny");
});

client.login(TOKEN);
