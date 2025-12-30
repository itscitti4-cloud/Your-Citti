module.exports = {
  config: {
    name: "addfriend",
    version: "1.0.1",
    role: 0,
    author: "Box Chat",
    description: "Displays a list of 15 friends and adds them to the group.",
    category: "group",
    guide: "{pn}",
    countDown: 5
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    try {
      // Fetching friend list
      const friends = await api.getFriendsList();
      const top15 = friends.slice(0, 15);

      if (top15.length === 0) {
        return api.sendMessage("Your friend list is empty or could not be loaded.", threadID, messageID);
      }

      let msg = "--- Friend List (Top 15) ---\n\n";
      top15.forEach((friend, index) => {
        msg += `${index + 1}. ${friend.fullName}\n`;
      });

      msg += "\nReply with a number (e.g., 1) to add a specific person, or reply 'all' to add everyone.";

      // Setting reply handler for Author Lock
      return api.sendMessage(msg, threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderID, // Locking the reply to the command user
          friends: top15
        });
      }, messageID);

    } catch (e) {
      return api.sendMessage("Failed to load friend list. Please try again later.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { threadID, messageID, body, senderID } = event;
    const { author, friends } = Reply;

    // AUTHOR LOCK: Only the user who started the command can reply
    if (senderID !== author) {
      return api.sendMessage("You are not allowed to use this reply.", threadID, messageID);
    }

    const input = body.toLowerCase();

    try {
      if (input === "all") {
        // Adding all 15 friends
        const ids = friends.map(f => f.userID);
        await api.addUserToGroup(ids, threadID);
        api.sendMessage("Request sent to add all 15 friends to the group.", threadID, messageID);
      } 
      else if (!isNaN(input)) {
        // Adding a specific friend by number
        const index = parseInt(input) - 1;
        if (friends[index]) {
          await api.addUserToGroup(friends[index].userID, threadID);
          api.sendMessage(`Successfully added ${friends[index].fullName} to the group.`, threadID, messageID);
        } else {
          api.sendMessage("Invalid selection. Please choose a number between 1 and 15.", threadID, messageID);
        }
      }
    } catch (err) {
      api.sendMessage("Error: Could not add user. This might be due to privacy settings or group restrictions.", threadID, messageID);
    }

    // Cleanup: Delete reply data after action
    global.GoatBot.onReply.delete(Reply.messageID);
  }
};
  
