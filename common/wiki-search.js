const axios = require("axios");
const cheerio = require("cheerio");

const resolveEnglishLink = async (germanUrl) => {
    try {
        const response = await axios.get(germanUrl);
        const $ = cheerio.load(response.data);
        return $(".interlanguage-link-en a").attr("href") || null;
    } catch (e) { return null; }
};

exports.search = async (query) => {
    if (query.includes("wikipedia.org/wiki/")) {
        if (query.includes("de.wikipedia.org")) {
             const betterUrl = await resolveEnglishLink(query);
             if (betterUrl) return { type: "URL", value: betterUrl };
        }
        return { type: "URL", value: query };
    }

    try {
        // 1. Suche Deutsch
        const sUrl = `https://de.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
        const r = await axios.get(sUrl);
        const [term, names, descs, urls] = r.data;

        // Fallback Englisch
        if (names.length === 0) {
            const sUrlEn = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
            const rEn = await axios.get(sUrlEn);
            const [tE, nE, dE, uE] = rEn.data;
            if (nE.length === 0) return { type: "NONE" };
            if (nE.length === 1) return { type: "EXACT", name: nE[0], url: uE[0] };
            return { type: "MULTIPLE", options: nE.map((n, i) => ({ name: n, url: uE[i], desc: dE[i] })) };
        }

        // Deutsch zu Englisch konvertieren
        const processed = await Promise.all(names.map(async (n, i) => {
            let u = urls[i];
            let d = descs[i];
            let dn = n;
            const enUrl = await resolveEnglishLink(u);
            if (enUrl) {
                u = enUrl;
                dn = decodeURIComponent(enUrl.split("/").pop()).replace(/_/g, " ");
                d += " [EN]";
            } else { d += " [DE]"; }
            return { name: dn, url: u, desc: d };
        }));

        if (processed.length === 1) return { type: "EXACT", name: processed[0].name, url: processed[0].url };
        return { type: "MULTIPLE", options: processed };

    } catch (e) { return { type: "ERROR" }; }
};