const wizardState = require("../../common/wizard-state");
exports.run = (client, functions) => {
    return async (msg, sender) => {
        if (msg.channel.type !== "DM") { msg.author.send("Schreib mir hier `!start`!"); return; }
        const pid = msg.author.id;
        if (!functions.state.getState().players[pid]) functions.state.addPlayer({ name: msg.author.username, id: pid, picks: [], basePoints: 0 });
        
        wizardState.add(pid);
        sender(`👋 **Willkommen!** Schreib mir einfach Namen (ohne Befehl).\nWen wählst du?`);
    };
};