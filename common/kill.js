require('dotenv').config({ path: `../.env.${process.env.PROD ? "prod" : "dev"}` });
const { MessageEmbed } = require('discord.js');
const format = require("./format"); // Pfad angepasst für common/
const image = require("./image-search");
const { configureOpenApi } = require("../commands/ai/open-api-config"); // Pfad zu Commands

const BASE_SCORE = 100;
const ALERT_EMOJI = process.env.ALERT_EMOJI;
const ALERT_EMOJI_REPEAT = process.env.ALERT_EMOJI_REPEAT;

// Konfiguration laden
const getAI = () => {
    return configureOpenApi({
        apiKey: process.env.OPENAI_PAINT_API_KEY,
        baseURL: process.env.OPENAI_PAINT_URL,
    });
};

// 1. Bild generieren
const fetchImage = async (name) => {
    if (+process.env.OPENAI_ENABLED) {
        try {
            const ai = getAI();
            const prompt = `A dignified, high quality commemorative oil painting portrait of ${name}, centered, fantasy style frame, dark background`;
            const response = await ai.images.generate({
                model: "dall-e-3", 
                prompt: prompt,
                n: 1,
                size: "1024x1024",
            });
            return response.data[0].url;
        } catch (error) {
            console.error("[kill]: AI Bild Fehler (Fallback):", error.message);
        }
    }
    return await image.getImage(name);
};

// 2. Sarkastischen Nachruf generieren
const fetchRoast = async (name, age, winners) => {
    if (!+process.env.OPENAI_ENABLED) return null;
    try {
        const ai = getAI();
        let prompt = `Person "${name}" ist tot (Alter: ${age||"?"}). Schreibe einen sarkastischen Nachruf (3-4 Sätze). Beziehe dich auf Karriere/Skandale. Sei respektlos aber faktisch.`;
        if (winners.length > 0) prompt += ` Gratuliere den Gewinnern (${winners.join(", ")}) zynisch.`;
        
        const completion = await ai.chat.completions.create({
            model: process.env.OPENAI_PAINT_MODEL || "grok-2-vision-1212",
            messages: [
                { role: "system", content: "Du bist ein zynischer DeathBot. Dein Humor ist tiefschwarz." },
                { role: "user", content: prompt }
            ]
        });
        return completion.choices[0].message.content;
    } catch (e) { return null; }
};

exports.kill = (id, stateFuncs, senderFunc, age) => {
    var currentState = stateFuncs.getState();
    
    // Punkte Logik (100 - Alter, min 1)
    let score = 0;
    if (age) {
        let calculatedScore = BASE_SCORE - age;
        score = calculatedScore < 1 ? 1 : calculatedScore;
    }

    if (!currentState.celebs[id]) return;

    var celeb = {...currentState.celebs[id]};
    var winners = celeb.players.filter(playerId => currentState.players[playerId].picks?.includes(id));
    var winnerNames = winners.map(w => currentState.players[w].name);
    var losers = celeb.players.filter(playerId => currentState.players[playerId].changed?.includes(id));

    // Alarm
    const emojis = Array(+ALERT_EMOJI_REPEAT).fill(ALERT_EMOJI).join(" ");
    senderFunc(`${emojis} ${format.bold("Die Glocken läuten für " + celeb.name + "!")}`);

    // AI Content laden
    Promise.all([
        fetchImage(celeb.name),
        fetchRoast(celeb.name, age, winnerNames)
    ]).then(([imgPath, roastText]) => {
        
        const imageEmbed = new MessageEmbed().setImage(imgPath);
        senderFunc({embeds: [imageEmbed]}).then(() => {
            
            // AI-Text
            if (roastText) senderFunc(`> *${roastText}*`);

            // Fakten & Punkte
            let infoMsg = "";
            if (winners.length > 0) {
                winners.forEach(winner => {
                    let player = {...currentState.players[winner]};
                    player.basePoints = player.basePoints + score;
                    stateFuncs.updatePlayer(winner, player);
                });
                const ageInfo = age ? `Alter: ${age} | Punkte: ${format.bold(score)}` : "Alter unbekannt";
                infoMsg = `\n💰 **Treffer!** ${format.stringCommaList(winnerNames)} sahnen ab.\n${ageInfo}`;
            } else {
                infoMsg = `\n(Niemand erhält Punkte.)`;
            }

            senderFunc(infoMsg);
    
            if (losers.length > 0) {
                const loserString = format.stringCommaList(losers.map(loser => currentState.players[loser].name));
                senderFunc(`\n(Spott für ${loserString}, die diesen Pick gelöscht hatten.)`);
            }
        });
    });

    celeb.isAlive = false;
    stateFuncs.updateCeleb(id, celeb);   
    stateFuncs.saveState(); 
}