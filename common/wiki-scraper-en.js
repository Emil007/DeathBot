const axios = require("axios");
const cheerio = require("cheerio");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const scrapeUrl = async (url) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const entries = [];
        $(".mw-parser-output ul li").each((i, el) => {
            const $el = $(el);
            if ($el.parents("#toc, .mw-headline, .navbox").length > 0) return;
            const linkTag = $el.find("a").first();
            const href = linkTag.attr("href");
            if (href && href.startsWith("/wiki/") && !href.includes(":")) {
                let text = $el.text().replace(/\[\d+\]/g, "").trim();
                entries.push({ id: href, text: text, url: "https://en.wikipedia.org" + href, lang: "en" });
            }
        });
        return entries;
    } catch (e) { return []; }
};

exports.scrape = async () => {
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const urls = [`https://en.wikipedia.org/wiki/Deaths_in_${currentYear}`];
    for (let i = 0; i <= currentMonthIndex; i++) urls.push(`https://en.wikipedia.org/wiki/Deaths_in_${MONTHS[i]}_${currentYear}`);
    
    const results = await Promise.all(urls.map(u => scrapeUrl(u)));
    const all = results.flat();
    const unique = [];
    const seen = new Set();
    all.forEach(e => { if(!seen.has(e.id)) { seen.add(e.id); unique.push(e); }});
    return unique;
};