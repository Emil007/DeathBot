const axios = require("axios");
const cheerio = require("cheerio");
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const checkEnglishVersion = async (germanUrl) => {
    try {
        const response = await axios.get(germanUrl);
        const $ = cheerio.load(response.data);
        return $(".interlanguage-link-en a").attr("href") || null;
    } catch (e) { return null; }
};

const scrapeUrl = async (url) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const entries = [];
        $(".mw-parser-output ul li").each((i, el) => {
            const $el = $(el);
            if ($el.parents("#toc").length > 0) return;
            const linkTag = $el.find("a").first();
            const href = linkTag.attr("href");
            if (href && href.startsWith("/wiki/") && !href.includes(":")) {
                let text = $el.text().replace(/\[\d+\]/g, "").trim().replace(/^\d+\.\s+\w+\.?\s+/, "");
                entries.push({ id: href, text: text, url: "https://de.wikipedia.org" + href, lang: "de" });
            }
        });
        return entries;
    } catch (e) { return []; }
};

exports.scrapeAndResolve = async () => {
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const urls = [`https://de.wikipedia.org/wiki/Nekrolog_${currentYear}`];
    for (let i = 0; i <= currentMonthIndex; i++) urls.push(`https://de.wikipedia.org/wiki/Nekrolog_${MONTHS[i]}_${currentYear}`);

    const results = await Promise.all(urls.map(u => scrapeUrl(u)));
    const all = results.flat();
    
    // Duplikate entfernen
    const unique = []; 
    const seen = new Set();
    all.forEach(e => { if(!seen.has(e.id)) { seen.add(e.id); unique.push(e); }});

    return { entries: unique, resolveEnglish: checkEnglishVersion };
};