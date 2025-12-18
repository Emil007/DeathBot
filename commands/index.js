module.exports = {
    // Players
    Pick: require("./players/pick"),
    Picks: require("./players/picks"),
    OldPicks: require("./players/old-picks"),
    RemovePick: require("./players/remove-pick"), // Aktualisiert
    Scores: require("./players/scores"),
    CarryOver: require("./players/carry-over"),
    StartSetup: require("./players/start-setup"), // NEU: Der Wizard Start
    MyList: require("./players/my-list"),         // NEU: Eigene Liste ansehen
    AdminCheck: require("./players/admin-check"), // NEU: Admin Übersicht

    // Celebs
    Celebs: require("./celebs/celebs"),
    Celeb: require("./celebs/celeb"),
    Check: require("./celebs/check"),
    AddCeleb: require("./celebs/add-celeb"),
    Include: require("./celebs/include"),
    Exclude: require("./celebs/exclude"),
    Kill: require("./celebs/kill"),
    Resurrect: require("./celebs/resurrect"),
    Blacklist: require("./celebs/blacklist"),

    // Points
    AddPoints: require("./points/add-points"),
    SetPoints: require("./points/set-points"),
    SubPoints: require("./points/sub-points"),

    // Bonuses (Falls du das Bonus-System nutzt)
    Award: require("./bonuses/award-bonus"),
    BonusList: require("./bonuses/bonus-list"),
    Bonuses: require("./bonuses/bonuses"),
    RevokeBonus: require("./bonuses/revoke-bonus"),

    // AI (Grok / OpenAI)
    Gpt: require("./ai/set-ai")("!gpt", require("./ai/ai-constants").aiModels.GPT),
    Grok: require("./ai/set-ai")("!grok", require("./ai/ai-constants").aiModels.GROK),
    GetAi: require("./ai/get-ai"),
    GetChat: require("./ai/get-chat"),
    ResetChat: require("./ai/reset-chat"),
    // Paint: require("./ai/paint"),  <-- ENTFERNT (Paint ist jetzt automatisch bei Kills)

    // System / Misc
    Say: require("./say"),
    State: require("./state/state"),
    SaveState: require("./state/save-state"),
    LoadState: require("./state/load-state"),
    NewYear: require("./state/new-year"),
    CommandList: require("./command-list")
};