exports.run = (client, functions) => {
    return async (msg, sender) => {
        const pid = msg.author.id;
        const name = msg.content.replace(/^!remove\s+/i, "").trim().toLowerCase();
        const state = functions.state.getState();
        const player = state.players[pid];
        
        const target = player?.picks.find(p => p.toLowerCase().includes(name));
        if (!target) { sender("❌ Nicht gefunden."); return; }

        let celeb = state.celebs[target];
        celeb.players = celeb.players.filter(id => id !== pid);
        functions.state.updateCeleb(target, celeb);
        
        player.picks = player.picks.filter(p => p !== target);
        functions.state.updatePlayer(pid, player);
        sender(`🗑️ **${target}** entfernt. (${player.picks.length}/25)`);
    };
};