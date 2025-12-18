const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const DATA = path.join(__dirname, "../data");
const BACKUP = path.join(__dirname, "../backups");

module.exports = () => {
    if (!fs.existsSync(BACKUP)) fs.mkdirSync(BACKUP);
    cron.schedule("0 */6 * * *", () => {
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const folder = path.join(BACKUP, ts);
        try {
            fs.mkdirSync(folder);
            ["players.json", "celebs.json", "saved-state.json", "daily-diff-cache.json"].forEach(f => {
                if(fs.existsSync(path.join(DATA, f))) fs.copyFileSync(path.join(DATA, f), path.join(folder, f));
            });
            console.log(`[Backup] Gesichert: ${ts}`);
        } catch (e) { console.error("[Backup] Fehler:", e); }
    });
};