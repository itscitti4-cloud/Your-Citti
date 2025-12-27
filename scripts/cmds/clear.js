module.exports = {
  config: {
    name: "clear",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 1, // Only group admins can use this
    shortDescription: "Delete multiple messages at once.",
    longDescription: "Remove a specified number of recent messages from the group chat.",
    category: "admin",
    guide: "{pn} <number of messages> (e.g., !clear 10)"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;
    const amount = parseInt(args[0]);

    // 1. Validation
    if (isNaN(amount) || amount <= 0) {
      return message.reply("Please provide a valid number of messages to clear (e.g., !clear 10).");
    }

    if (amount > 50) {
      return message.reply("For safety reasons, you can only clear up to 50 messages at a time.");
    }

    try {
      // 2. Fetch messages from the thread
      const history = await api.getThreadHistory(threadID, amount);
      
      // 3. Filter messages sent by the bot (or all messages if the bot has admin/unsend rights)
      const botID = api.getCurrentUserID();
      const messagesToDelete = history.filter(msg => msg.senderID === botID).map(msg => msg.messageID);

      if (messagesToDelete.length === 0) {
        return message.reply("I couldn't find any of my own messages to delete. (Note: On Messenger, I can only 'unsend' my own messages).");
      }

      message.reply(`Attempting to clear ${messagesToDelete.length} messages...`);

      //
    
