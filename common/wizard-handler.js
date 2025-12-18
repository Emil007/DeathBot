const wikiSearch = require("./wiki-search");
const wizardState = require("./wizard-state");
const PICK_LIMIT = parseInt(process.env.PICK_LIMIT) || 25;

exports.handle = async (msg, functions) => {
    const userId = msg.author.id;
    const content = msg.content.trim();

    if (["stop", "ende", "exit"].includes(content.toLowerCase())) {
        wizardState.remove(userId);
        msg.author.send("🛑 Setup beendet. Nutze `!start`, um weiterzumachen.");
        return;
    }

    msg.author.send("🔎 *Suche...*");
    const result = await wikiSearch.search(content);

    if (result.type === "NONE" || result.type === "ERROR") {
        msg.author.send(`❌ Nichts gefunden für "**${content}**". Versuch den Link oder eine andere Schreibweise.`);
        return;
    }

    if (result.type === "MULTIPLE") {
        let text = `🤔 Mehrere Treffer. Bitte kopiere den **Link**:\n\n`;
        result.options.forEach(opt => text += `• ${opt.name} (${opt.desc})\n  Link: \`${opt.url}\`\n`);
        msg.author.send(text);
        return;
    }

    let finalName = result.type === "URL" ? decodeURIComponent(result.value.split("/").pop()).replace(/_/g, " ") : result.name;
    const stateFuncs = functions.state;
    const player = stateFuncs.getState().players[userId];

    if (player.picks.includes(finalName)) {
        msg.author.send(`⚠️ **${finalName}** hast du schon!`);
        return;
    }

    functions.addCeleb(finalName, userId, msg, () => {
        const count = stateFuncs.getState().players[userId].picks.length;
        if (count >= PICK_LIMIT) {
            wizardState.remove(userId);
            msg.author.send(`✅ **${finalName}** gespeichert!\n🎉 **LISTE VOLL (${count}/${PICK_LIMIT})!** Viel Erfolg!`);
        } else {
            msg.author.send(`✅ **${finalName}** gespeichert! (${count}/${PICK_LIMIT})\nWer ist Nr. **${count + 1}**?`);
        }
    });
};