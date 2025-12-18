require('dotenv').config({ path: `.env.${process.env.PROD ? "prod" : "dev"}` });
const { Client, Intents, MessageEmbed } = require('discord.js');
const fs = require("fs");

// NEU: Wizard (Setup-Assistent) Imports
const wizardState = require("./common/wizard-state");
const wizardHandler = require("./common/wizard-handler");

// WICHTIG: Intents für DMs (Direct Messages) und Partials hinzufügen
const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.DIRECT_MESSAGES // Erlaubt DMs
    ],
    partials: ["CHANNEL"] // Notwendig für DMs
});

// Hilfsfunktionen laden
const functions = {
    addCeleb: require("./common/add-celeb"),
    addPlayer: require("./common/add-player"),
    checkWiki: require("./common/check-wiki"),
    error: require("./common/error"),
    find: require("./common/find"),
    format: require("./common/format"),
    imageSearch: require("./common/image-search"),
    kill: require("./common/kill"),
    pointManager: require("./common/point-manager"),
    state: require("./common/state")
}

const connection = {}; 

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    functions.state.loadState();
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;

    // --- WIZARD LOGIK START ---
    // Wenn User im Setup-Modus ist UND eine DM schreibt (und kein Befehl nutzt)
    if (msg.channel.type === "DM" && wizardState.has(msg.author.id) && !msg.content.startsWith("!")) {
        await wizardHandler.handle(msg, functions);
        return; // Verhindert, dass es als normaler Befehl gewertet wird
    }
    // --- WIZARD LOGIK ENDE ---

    if (msg.content.indexOf(process.env.PREFIX) !== 0) return;

    const args = msg.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const cmd = client.commands.get(command);

    if (!cmd) return;

    cmd.run(client, functions, connection)(msg, text => msg.channel.send(text));
});

// Commands laden
client.commands = new Map();
const commands = require("./commands");
const commandList = require("./data/command-list.json");

for (const command of Object.keys(commandList)) {
    const cmdData = commandList[command];
    if (commands[cmdData.command]) {
        client.commands.set(command.substring(1), commands[cmdData.command]);
    }
}

// --- JOBS LADEN ---
// 1. Der klassische Wiki-Poll (für Punktevergabe bei Picks)
require("./jobs/poll-wiki")(functions, client);

// 2. NEU: Der Tagesbericht (Diff Report EN/DE)
require("./jobs/daily-diff-report")(functions, client);

// 3. NEU: Backup System
require("./jobs/backup-system")(functions, client);


client.login(process.env.TOKEN);