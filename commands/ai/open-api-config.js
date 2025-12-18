const OpenAI = require("openai");

exports.configureOpenApi = (config) => {
    // Wir erstellen eine neue Instanz mit dem Key und der Custom URL (für xAI)
    return new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL, 
    });
};