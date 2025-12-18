const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const scraperEn = require("../common/wiki-scraper-en");
const scraperDe = require("../common/wiki-scraper-de");
const { configureOpenApi } = require("../commands/ai/open-api-config");

const CACHE_FILE = path.join(__dirname, "../data/daily-diff-cache.json");
const loadCache = () => fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) : { ids: [] };
const saveCache = (ids) => fs.writeFileSync(CACHE_FILE, JSON.stringify({ ids: [...new Set(ids)] }, null, 2), "utf8");

const fetchAIComment = async (names) => {
    if (!process.env.OPENAI_ENABLED) return null;
    try {
        const ai = configureOpenApi({ apiKey: process.env.OPENAI_PAINT_API_KEY, baseURL: process.env.OPENAI_PAINT_URL });
        const prompt = `Heute sind ${names.length} neue Promis gestorben (z.B. ${names.slice(0,5).map(n=>n.text).join(", ")}). Schreibe eine kurze, zynische Einleitung (max 2 Sätze) für den Tagesbericht.`;
        const res = await ai.chat.completions.create({ model: process.env.OPENAI_PAINT_MODEL, messages: [{role:"system",content:"Du bist der DeathBot. Zynisch."}, {role:"user",content:prompt}] });
        return res.choices[0].message.content;
    } catch (e) { return null; }
};

module.exports = (functions, client) => {
    cron.schedule("0 9 * * *", async () => {
        console.log("[DiffReport] Starte...");
        const channel = client.channels.cache.get(process.env.CHANNEL);
        const [en, deData] = await Promise.all([scraperEn.scrape(), scraperDe.scrapeAndResolve()]);
        const cache = loadCache();
        const known = new Set(cache.ids);
        const currentEnIds = new Set(en.map(e => e.id));
        
        const finalDe = [], newEnFromDe = [];

        for (const d of deData.entries) {
            if (known.has(d.id)) continue;
            const enUrl = await deData.resolveEnglish(d.url);
            if (enUrl) {
                const enId = enUrl.split("wikipedia.org")[1];
                if (currentEnIds.has(enId) || known.has(enId)) { known.add(d.id); continue; }
                newEnFromDe.push({ id: enId, text: d.text + " 🌍", url: enUrl, lang: "en" });
                currentEnIds.add(enId); known.add(d.id); known.add(enId);
            } else { finalDe.push(d); known.add(d.id); }
        }

        const newEn = en.filter(e => !known.has(e.id));
        const finalEn = [...newEn, ...newEnFromDe];

        if ((finalEn.length > 0 || finalDe.length > 0) && channel) {
            const comment = await fetchAIComment([...finalEn, ...finalDe]);
            let msg = `📋 **Tagesbericht**\n${comment ? `> *${comment}*\n\n` : ""}`;
            if (finalEn.length) { msg += `🌍 **International:**\n`; finalEn.sort((a,b)=>a.text.localeCompare(b.text)).slice(0,15).forEach(e=>msg+=`• [${e.text}](${e.url})\n`); if(finalEn.length>15) msg+=`... (+${finalEn.length-15})\n`; msg+="\n"; }
            if (finalDe.length) { msg += `🇩🇪 **Regional:**\n`; finalDe.sort((a,b)=>a.text.localeCompare(b.text)).slice(0,10).forEach(e=>msg+=`• [${e.text}](${e.url})\n`); if(finalDe.length>10) msg+=`... (+${finalDe.length-10})\n`; }
            channel.send(msg.substring(0, 1950));
        }
        
        saveCache([...known, ...currentEnIds]);
    });
};