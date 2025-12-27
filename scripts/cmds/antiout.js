module.exports = {
  config: {
    name: "antiout",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 1, // Only group admins or bot admins can toggle this
    shortDescription: "Automatically re-add members who leave the group.",
    longDescription: "When enabled, the bot will automatically add back any member who leaves the group.",
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
      return message.reply("Invalid syntax! Use: !antiout on or !antiout off");
    }
  },

  onEvent: async function ({ api, event, message }) {
    const { threadID, logMessageType, logMessageData } = event;

    // Check if antiout is enabled for this thread
    if (global.antiout && global.antiout.get(threadID) === true) {
      // Check if someone left the group
      if (logMessageType === "log:unsubscribe") {
        const leftUserID = logMessageData.leftParticipantFbId;

        // If the user who left is not the bot itself
        if (leftUserID !== api.getCurrentUserID()) {
          try {
            await api.addUserToGroup(leftUserID, threadID);
            return message.reply(`Antiout is active! I have added the user back to the group.`);
          } catch (error) {
            console.error("Antiout Error:", error);
            // Optional: Notify if bot lacks permission to add
          }
        }
      }
    }
  }
};
