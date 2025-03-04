// lookupKeys = array of keys from lookupKeys
exports.findCeleb = (lookupKeys, msg, stateFuncs, noSpeak) => {
    let celeb = lookupKeys[0];
    let state = stateFuncs.getState();

    if(lookupKeys.length > 1 || !state.celebs[celeb]) {
      // Someone gave firstname lastname lookupKeys, so need to search for it...
      var keys = Object.keys(state.celebs);      
      var matches = keys.filter(key => lookupKeys.every(lookupKey => state.celebs[key].name.toLowerCase().includes(lookupKey.toLowerCase())));

      if (matches.length === 0) {
        celeb = null;
      } else {
        celeb = matches[0];        
      }
    }

    if (!state.celebs[celeb]) {
      if (!noSpeak) {
        msg.channel.send(lookupKeys.join(" ") + " is not on my list... yet.");
      }
      return;
    }

    return celeb;
}

// lookupKey = Single string key
exports.findPlayer = (lookupKey, msg, stateFuncs, noSpeak) => {
  var state = stateFuncs.getState();
  if(!state.players[state.playerKeys[lookupKey]]) {
    // Some other name passed (username maybe?) or partial match
    var keys = Object.keys(state.players);
    var matches = keys.filter(key => (state.players[key].name.toLowerCase().includes(lookupKey.toLowerCase())) || (state.players[key].username?.toLowerCase()?.includes(lookupKey.toLowerCase())));

    if (matches.length === 0) {
      if (!noSpeak) {
        msg.channel.send("I didn't recognise " + lookupKey + " - try one of the following:\n" + state.playerKeys.join("\n"));
      }
      return null;
    } else {
      return matches[0];
    }
  } else {
    return lookupKey;
  }
}

exports.findPlayerByUsername = (username, stateFuncs) => {
  var state = stateFuncs.getState();
  var keys = Object.keys(state.players);
  var matches = keys.filter(key => (state.players[key].userId == username));

  if (matches.length === 0) {
    return null;
  } else {
    return matches[0];
  }
}

exports.findPlayerByDiscordId = (id, stateFuncs) => {
  var state = stateFuncs.getState();
  var keys = Object.keys(state.players);
  var matches = keys.filter(key => (state.players[key].id == id));

  if (matches.length === 0) {
    return null;
  } else {
    return matches[0];
  }
}