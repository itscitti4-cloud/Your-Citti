const antispamConfig = new Map();

module.exports = {
  config: {
    name: "antispam",
    version: "1.0.1",
    author: "AkHi",
    countDown: 5,
    role: 1, // Only admins can configure
    shortDescription: "Protect the group from message spamming.",
    longDescription: "Automatically warns or kicks users who send messages too quickly.",
    category: "admin",
    guide: "{pn} on | off"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    if (!global.antispamStatus) global.antispamStatus = new Map();

    const mode = args[0]?.toLowerCase();

    if (mode === "on") {
      global.antispamStatus.set(threadID, true);
      return message.reply("Antispam protection is now enabled for this group.");
    } else if (mode === "off") {
      global.antispamStatus.set(threadID, false);
      return message.reply("Antispam protection has been disabled.");
    } else {
      return message.reply("Invalid usage! Use: !antispam on/off");
    }
  },

  onChat: async function ({ api, event, message }) {
    const { threadID, senderID } = event;

    // Check if antispam is enabled for this thread
    if (!global.antispamStatus || !global.antispamStatus.get(threadID)) return;

    // Don't monitor bot or admins
    const botID = api.getCurrentUserID();
    if (senderID === botID) return;

    const now = Date.now();
    const threadData = antispamConfig.get(threadID + senderID) || { count: 0, lastMessage: now };

    // Reset count if the interval is more than 5 seconds
    if (now - threadData.lastMessage > 5000) {
      threadData.count = 1;
    } else {
      threadData.count++;
    }

    threadData.lastMessage = now;
    antispamConfig.set(threadID + senderID, threadData);

    // If user sends more than 5 messages in 5 seconds
    if (threadData.count > 5) {
      try {
        // Fetch thread info to check if bot is admin
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

        if (!adminIDs.includes(botID)) {
          antispamConfig.delete(threadID + senderID); // Reset to avoid spamming the warning
          return message.reply("Security Alert: Spam detected, but I cannot remove the user because I am not an admin in this group.");
        }

        // Clear data to prevent infinite loop
        antispamConfig.delete(threadID + senderID);

        // Remove the spammer
        await api.removeUserFromGroup(senderID, threadID);
        return message.reply("Security Alert: A user has been removed for spamming messages too quickly.");
      } catch (error) {
        console.error("Antispam Error:", error);
      }
    }
  }
};
