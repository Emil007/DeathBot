const wikiSearch = require("../../common/wiki-search");

exports.run = (client, functions, connection) => {
    return async (msg, sender) => {
        const PICK_LIMIT = parseInt(process.env.PICK_LIMIT) || 25;
        const stateFuncs = functions.state;
        const state = stateFuncs.getState();
        
        // Logik: Wenn Admin jemanden erwähnt (!pick @User Name), pickt er für den.
        // Sonst pickt der User für sich selbst.
        let playerId = msg.author.id;
        let playerName = msg.author.username;
        let content = msg.content;

        if (msg.mentions.users.size > 0 && msg.author.id === process.env.ADMIN_ID) {
            const target = msg.mentions.users.first();
            playerId = target.id;
            playerName = target.username;
            content = content.replace(/<@!?[0-9]+>/, "").trim();
        }

        // Input bereinigen (!pick entfernen)
        let pickName = content.replace(/^!pick\s+/i, "").trim();
        if (!pickName) {
            sender("Bitte einen Namen angeben: `!pick Name`");
            return;
        }

        // Spieler anlegen falls neu
        if (!state.players[playerId]) {
            stateFuncs.addPlayer({ name: playerName, id: playerId, picks: [], basePoints: 0 });
        }

        const player = state.players[playerId];
        if (player.picks.length >= PICK_LIMIT) {
            sender(`❌ ${playerName} hat bereits ${PICK_LIMIT} Picks.`);
            return;
        }

        sender(`🔎 Suche nach "${pickName}"...`);
        
        // Neue Suche nutzen (die wir in common/wiki-search.js erstellt haben)
        const result = await wikiSearch.search(pickName);

        if (result.type === "NONE" || result.type === "ERROR") {
            sender(`❌ Nichts gefunden. Versuch es mit dem Wiki-Link.`);
            return;
        }

        if (result.type === "MULTIPLE") {
            sender(`🤔 Mehrere Ergebnisse. Bitte nutze den genauen Link oder den Wizard (\`!start\`):\n` + result.options.slice(0,3).map(o => `• ${o.name}`).join("\n"));
            return;
        }

        // Treffer (EXACT oder URL)
        let finalName = result.type === "URL" ? decodeURIComponent(result.value.split("/").pop()).replace(/_/g, " ") : result.name;

        if (player.picks.includes(finalName)) {
            sender(`⚠️ ${finalName} ist schon auf der Liste.`);
            return;
        }

        functions.addCeleb(finalName, playerId, msg, () => {
             sender(`✅ **${finalName}** für ${playerName} hinzugefügt! (${player.picks.length + 1}/${PICK_LIMIT})`);
        });
    };
};