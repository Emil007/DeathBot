const scraperEn = require("./wiki-scraper-en");
const scraperDe = require("./wiki-scraper-de");
const killer = require("./kill");

// Diese Funktion prüft, ob ein Eintrag zu einem Promi passt
// (Übernommen und angepasst aus dem Original)
const checkList = (stateFuncs, entries, channel) => {
  const state = stateFuncs.getState();
  const celebKeys = Object.keys(state.celebs);

  celebKeys
    .filter(
      (celeb) =>
        state.celebs[celeb].isAlive && !state.celebs[celeb].excludeFromAuto
    )
    .forEach((celebKey) => {
      const celebObj = state.celebs[celebKey];
      
      entries.forEach((entry) => {
        // 1. Suchbegriffe definieren
        // Wenn AKAs da sind, nutzen wir die. Sonst den Namen.
        let searchTerms = celebObj.aka;
        
        // Logik aus dem Original: Wenn keine AKAs, splitten wir den Namen
        // z.B. "Michael Jackson" -> ["Michael", "Jackson"] -> Beide müssen vorkommen
        if (!searchTerms || searchTerms.length === 0) {
          searchTerms = celebObj.name.split(" ");
        }

        // Wir prüfen, ob ALLE Begriffe im Text vorkommen (Strenge Prüfung)
        // Das verhindert, dass "Michael Jordan" bei "Michael Jackson" triggert.
        // HINWEIS: Bei AKAs ist es meistens eine ODER Prüfung, im Original war es aber 
        // so implementiert, dass er `searchTerms` als Array von Strings nimmt.
        // Wir behalten die Original-Logik bei:
        // Wir prüfen: Enthält der Text den Namen ODER eines der AKAs?
        
        let isMatch = false;

        // Fall A: Wir haben AKAs definiert (z.B. ["The King of Pop", "MJ"])
        if (celebObj.aka && celebObj.aka.length > 0) {
             // Wenn EINER der AKAs passt
             isMatch = celebObj.aka.some(alias => entry.text.toLowerCase().includes(alias.toLowerCase()));
             // Zusätzlich Check auf den Hauptnamen
             if (!isMatch && entry.text.toLowerCase().includes(celebObj.name.toLowerCase())) {
                 isMatch = true;
             }
        } 
        // Fall B: Keine AKAs -> Wir nutzen den Split-Namen (Original Logik)
        else {
             const nameParts = celebObj.name.split(" ");
             // ALLE Teile müssen vorkommen (z.B. "Betty" UND "White")
             isMatch = nameParts.every(part => entry.text.toLowerCase().includes(part.toLowerCase()));
        }

        if (isMatch) {
          // 2. Blacklist Check (Wichtig!)
          let blacklisted = false;
          if (celebObj.blacklist && celebObj.blacklist.length > 0) {
            celebObj.blacklist.forEach((blk) => {
              let blacklistSearch = blk.split(" ");
              // Wenn alle Teile des Blacklist-Begriffs vorkommen -> Blockieren
              if (blacklistSearch.every((term) => entry.text.toLowerCase().includes(term.toLowerCase()))) {
                blacklisted = true;
              }
            });
          }

          if (!blacklisted) {
            console.log(
              new Date(),
              `[poll-wiki]: TREFFER (${entry.lang}) für ` + celebObj.name
            );

            // Alter extrahieren (Original Logik wiederhergestellt)
            let ageMatches = entry.text.match(/\d{2,3}/); // Sucht 2 oder 3-stellige Zahl
            let age = ageMatches ? parseInt(ageMatches[0]) : null;
            
            // Plausibilitätsprüfung für das Alter
            if (age && (age < 10 || age > 120)) age = null;

            killer.kill(
              celebKey,
              stateFuncs,
              (x) => channel.send(x),
              age
            );
          }
        }
      });
    });
};

exports.checkWiki = async (stateFuncs, channel, isInitial) => {
  try {
      // WIR LADEN JETZT ENGLISCH UND DEUTSCH (Ganzes Jahr + Aktuell)
      const [enEntries, deData] = await Promise.all([
          scraperEn.scrape(),
          scraperDe.scrapeAndResolve()
      ]);

      // Alles in eine Liste werfen
      const allEntries = [...enEntries, ...deData.entries];

      // Die Prüf-Logik aufrufen
      checkList(stateFuncs, allEntries, channel);

      if (isInitial) {
        console.log(new Date(), `[poll-wiki]: Initiale Prüfung abgeschlossen (${allEntries.length} Einträge gescannt).`);
      }

  } catch (e) {
      console.log(new Date(), "[poll-wiki]: ERROR: ", e.message);
  }
};