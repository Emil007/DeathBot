exports.run = (client, functions, connection) => {
    return async (msg, sender) => {
        const state = functions.state.getState();
        
        // Kurzes Leaderboard für den Bot bauen
        let leaderboard = Object.values(state.players)
            .sort((a, b) => b.basePoints - a.basePoints)
            .slice(0, 5)
            .map((p, i) => `${i+1}. ${p.name} (${p.basePoints})`)
            .join("\n");

        const systemPrompt = `
Du bist der DeathBot.
Kontext: Du verwaltest ein makabres Tippspiel ("Death Pool"), bei dem Spieler Punkte bekommen, wenn Promis sterben.
Persönlichkeit: Zynisch, sarkastisch, tiefschwarzer Humor. Du findest den Tod nicht traurig, sondern faszinierend.
Sprache: Deutsch (du darfst aber englische Begriffe nutzen).
Regeln: Mach dich über Spieler mit schlechten Tipps lustig.

Aktuelle Top 5 Spieler:
${leaderboard}

Antworte auf die folgende Nachricht des Users kurz, bissig und unterhaltsam.
        `.trim();

        // Chat-History initialisieren falls nötig
        if (!client.chatHistory) client.chatHistory = [];
        
        // System Prompt setzen
        // Hinweis: Wir speichern das hier simpel im Client-Objekt für die Session
        client.chatHistory.push({ role: "system", content: systemPrompt });
        
        sender("💀 *Räuspert sich* ... Ich höre.");
    };
};