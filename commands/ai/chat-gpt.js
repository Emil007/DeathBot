const OpenAI = require("openai")
const OPENAI_ENABLED = process.env.OPENAI_ENABLED;
const BOT_USER_ID = process.env.BOT_USER_ID;

const configuration = new OpenAI.Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAI.OpenAIApi(configuration);

const breakdownLongMessage = (message) => message.match(/.{1,1950}/g);

exports.chatGpt = async (stateFuncs, msg) => {
  if(+OPENAI_ENABLED) {    
    if (!configuration.apiKey) {
        console.error("OpenAI API key not configured");
        msg.reply("Open AI configuration missing. Get Mike to fix it.");
      return;
    }

    try {
      const state = stateFuncs.getState();
      var messageContent = msg.content.replace(`<@${BOT_USER_ID}>`, 'DeathBot,');
      console.log(new Date(), `[chat-gpt]: ${msg.author.username} has asked:`, messageContent);
      var sender = state.playerKeys.filter(x => (msg.author.id == state.players[x].userId));
      state.chatMessages = stateFuncs.addMessage("user", (sender || "Someone") + " has said the following - reply in character: " + messageContent);

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: state.chatMessages,
        max_tokens: 1250
      });
      
      var addReplyHistory = true;
      var reply = completion.data.choices[0].message.content;
      var responses = reply.split(/\r?\n\r?\n/);
      if (responses.length > 1) {
        addReplyHistory = false;
      }
      
      responses.forEach(res => {
        if (res && res.match(/[a-zA-Z0-9]+/)) {
          var resToSend = [ res ];
          if (res.length > 1950) {
            addReplyHistory = false;
            resToSend = breakdownLongMessage(res);
          }

          resToSend.forEach(r => {
            msg.channel.send(r.replace(/deathbot/ig, '**DeathBot**'));
          });
        }
      })

      // Replies of excessive length excluded to ensure that subsequent requests
      // don't breach the limit at the ChatGPT model level.
      if (addReplyHistory) {
        state.chatMessages = stateFuncs.addMessage("assistant", reply);
      }
    } 
    catch(error) {
      if (error.response) {
        msg.reply(`I'm sorry, but you may have to repeat that...\n (OpenAPI Error: \`${error.response?.data?.error?.code}\`)`);
        console.error(error.response.status, error.response.data);
      } else {
        console.error(new Date(), `[chat-gpt]: Error with OpenAI API request: ${error.message}`);
        msg.reply(new Date(), `[chat-gpt]: Error with OpenAI API request: ${error.message}`);
      }
    }
  } else {
    console.log(new Date(), "[chat-gpt]: ChatGPT disabled.");
  }
}