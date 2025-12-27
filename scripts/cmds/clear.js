module.exports = {
  config: {
    name: "clear",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 1, 
    shortDescription: "Clear bot messages.",
    longDescription: "Unsend a specific number of messages sent by the bot in this group chat.",
    category: "admin",
    guide: "{pn} <number> (e.g., !clear 10)"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    const amount = parseInt(args[0]);

    // Validation for input
    if (isNaN(amount) || amount <= 0) {
      return message.reply("Please provide a valid number of messages to clear (e.g., !clear 10).");
    }

    // Limit check for safety
    if (amount > 50) {
      return message.reply("For safety reasons, you can only clear up to 50 messages at a time.");
    }

    try {
      // 1. Fetch thread history
      const history = await api.getThreadHistory(threadID, amount);
      const botID = api.getCurrentUserID();
      
      // 2. Filter only bot's messages
      const messagesToDelete = history
        .filter(msg => msg.senderID === botID)
        .map(msg => msg.messageID);

      if (messagesToDelete.length === 0) {
        return message.reply("No messages from the bot were found in the recent history.");
      }

      // 3. Unsend messages one by one
      for (const id of messagesToDelete) {
        await api.unsendMessage(id);
      }

      return message.reply(`Successfully cleared ${messagesToDelete.length} messages.`);

    } catch (error) {
      console.error(error);
      return message.reply("An error occurred while trying to clear messages. Please try again later.");
    }
  }
};
