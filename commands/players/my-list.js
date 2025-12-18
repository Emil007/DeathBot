const format = require("../../common/format");

exports.run = (client, functions, connection) => {
    return async (msg, sender) => {
        const state = functions.state.getState();
        const player = state.players[msg.author.id];
        const limit = parseInt(process.env.PICK_LIMIT) || 25;

        if (!player || !player.picks || player.picks.length === 0) {
            // Check ob es eine DM war, sonst Antwort im Channel
            const reply = "📭 Deine Liste ist noch komplett leer. Starte mit `!start`!";
            if (msg.channel.type === "DM") sender(reply);
            else msg.author.send(reply).catch(() => sender("Ich habe dir eine DM geschickt."));
            return;
        }

        // Liste schön formatieren
        let output = `**📝 Deine aktuelle Liste (${player.picks.length}/${limit}):**\n\n`;
        player.picks.forEach((pick, index) => {
            output += `\`${index + 1}.\` ${pick}\n`;
        });

        output += `\nZum Entfernen: \`!remove Name\`\nZum Hinzufügen: \`!start\` oder \`!pick Name\``;

        // Immer per DM senden, um den Channel nicht zu fluten
        msg.author.send(output).catch(e => {
            sender("Ich kann dir keine DM senden. Bitte öffne deine DMs für diesen Server.");
        });
        
        if (msg.channel.type !== "DM") {
            sender("Ich habe dir deine Liste per DM geschickt! 📩");
        }
    };
};