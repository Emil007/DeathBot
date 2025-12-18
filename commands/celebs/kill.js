require('dotenv').config({ path: `../.env.${process.env.PROD ? "prod" : "dev"}` });
const { MessageEmbed } = require('discord.js');
const format = require("../../common/format");
const image = require("../../common/image-search");
const { configureOpenApi } = require("../ai/open-api-config");

const getAI = () => configureOpenApi({ apiKey: process.env.OPENAI_PAINT_API_KEY, baseURL: process.env.OPENAI_PAINT_URL });

const fetchImage = async (name) => {
    if (+process.env.OPENAI_ENABLED) {
        try {
            const res = await getAI().images.generate({ model: "dall-e-3", prompt: `A dignified, high quality commemorative oil painting portrait of ${name}, centered, fantasy style frame, dark background`, n: 1, size: "1024x1024" });
            return res.data[0].url;
        } catch (e) {}
    }
    return await image.getImage(name);
};

const fetchRoast = async (name, age, winners) => {
    if (!+process.env.OPENAI_ENABLED) return null;
    try {
        const prompt = `Person "${name}" ist tot (Alter: ${age||"?"}). Schreibe einen sarkastischen Nachruf (3-4 Sätze). Beziehe dich auf Karriere/Skandale. Sei respektlos aber faktisch. ${winners.length ? `Gratuliere den Gewinnern (${winners.join(", ")}) zynisch.` : ""}`;
        const res = await getAI().chat.completions.create({ model: process.env.OPENAI_PAINT_MODEL, messages: [{ role: "system", content: "Du bist ein zynischer DeathBot." }, { role: "user", content: prompt }] });
        return res.choices[0].message.content;
    } catch (e) { return null; }
};

exports.kill = (id, stateFuncs, senderFunc, age) => {
    const state = stateFuncs.getState();
    const score = age ? Math.max(1, 100 - age) : 0;
    if (!state.celebs[id]) return;

    const celeb = {...state.celebs[id]};
    const winners = celeb.players.filter(pid => state.players[pid].picks?.includes(id));
    const winnerNames = winners.map(w => state.players[w].name);
    
    senderFunc(`${Array(3).fill("🚨").join(" ")} ${format.bold("Die Glocken läuten für " + celeb.name + "!")}`);

    Promise.all([fetchImage(celeb.name), fetchRoast(celeb.name, age, winnerNames)]).then(([img, roast]) => {
        senderFunc({embeds: [new MessageEmbed().setImage(img)]}).then(() => {
            if (roast) senderFunc(`> *${roast}*`);
            
            if (winners.length > 0) {
                if (age) winners.forEach(w => { let p = {...state.players[w]}; p.basePoints += score; stateFuncs.updatePlayer(w, p); });
                senderFunc(`\n💰 **Punkte:** ${format.stringCommaList(winnerNames)} erhalten je ${format.bold(score)} Punkte (Alter: ${age}).`);
            } else { senderFunc(`\n(Niemand hatte diese Person auf der Liste.)`); }
        });
    });

    celeb.isAlive = false;
    stateFuncs.updateCeleb(id, celeb);
    stateFuncs.saveState();
};