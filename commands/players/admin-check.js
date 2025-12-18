const format = require("../../common/format");

exports.run = (client, functions, connection) => {
    return async (msg, sender) => {
        // Nur Admin darf das
        if (msg.author.id !== process.env.ADMIN_ID) return;

        const state = functions.state.getState();
        const players = state.players;
        
        let message = "**👑 Admin Status Report:**\n\n";
        let count = 0;
        
        Object.values(players).forEach(p => {
            if (p.picks && p.picks.length > 0) {
                message += `${format.bold(p.name)}: ${p.picks.length} Picks\n`;
                count++;
            }
        });

        if (count === 0) message += "Noch keine aktiven Spieler.";

        msg.author.send(message).catch(() => sender("Konnte dir keine DM senden."));
    };
};