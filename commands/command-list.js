const commandList = require("../data/command-list.json");
const format = require("../common/format");

module.exports = {
    name: '!commands',
    description: 'Command list - returns a list of available commands',
    execute(msg, args) {
      let commandListHeader = format.bold("Command List");
      let commandListString = "";

      addCommand = (cmd, description) => {
        commandListString = commandListString + "\n\n" + cmd + ":\n" + description;
      }

      commandList.commands.forEach(cmd => {
        addCommand(cmd.name, cmd.description);
      });

      msg.channel.send(commandListHeader + format.codeBlock(commandListString, "autohotkey"));
      msg.channel.send("You can send these to me via private message too if you like.");
    },
};