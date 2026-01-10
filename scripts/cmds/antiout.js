module.exports = {
  config: {
    name: "antiout",
    version: "1.0.2",
    author: "AkHi",
    countDown: 5,
    role: 1, 
    shortDescription: "Automatically re-add members who leave the group.",
    longDescription: "When enabled, the bot will automatically add back any member who leaves the group if the bot is admin.",
    category: "admin",
    guide: "{pn} on/off"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    if (!global.antiout) global.antiout = new Map();

    const mode = args[0]?.toLowerCase();

    if (mode === "on") {
      global.antiout.set(threadID, true);
      return message.reply("Antiout mode has been enabled for this group.");
    } else if (mode === "off") {
      global.antiout.set(threadID, false);
      return message.reply("Antiout mode has been disabled for this group.");
    } else {
      return message.reply("Invalid syntax! Use: {pn} on or {pn} off");
    }
  },

  onEvent: async function ({ api, event, message }) {
    const { threadID, logMessageType, logMessageData } = event;

    if (global.antiout && global.antiout.get(threadID) === true) {
      if (logMessageType === "log:unsubscribe") {
        const leftUserID = logMessageData.leftParticipantFbId;
        const botID = api.getCurrentUserID();

        if (leftUserID !== botID) {
          try {
            // সরাসরি ফেসবুক থেকে গ্রুপের তথ্য নেওয়া হচ্ছে
            const threadInfo = await api.getThreadInfo(threadID);
            const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

            // চেক করা হচ্ছে বট অ্যাডমিন কি না
            if (!adminIDs.includes(botID)) {
              return message.reply("Antiout is enabled, but I can't add the user back because I am not an admin in this group.");
            }

            await api.addUserToGroup(leftUserID, threadID);
            return message.reply(`Antiout is active! I have added the user back to the group.`);
          } catch (error) {
            console.error("Antiout Error:", error);
            return message.reply("An error occurred while trying to add the user back. They might have blocked the bot or restricted their privacy settings.");
          }
        }
      }
    }
  }
};
