module.exports = {
  config: {
    name: "sleep",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 2, // Bot Admin, Developer, Operator access
    description: "Turn off bot replies for 10 minutes in the current group",
    category: "admin",
    guide: "{pn} mode on"
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID, messageID } = event;
    const mode = args[0]?.toLowerCase();

    if (mode === "mode" && args[1]?.toLowerCase() === "on") {
      // 10 minutes in milliseconds
      const sleepDuration = 10 * 60 * 1000; 

      // Set thread data to sleep mode
      await threadsData.set(threadID, true, "settings.isSleep");

      api.sendMessage("Sleep mode is now ON. The bot will not reply to any commands in this group for 10 minutes.", threadID, messageID);

      // Automatically turn off sleep mode after 10 minutes
      setTimeout(async () => {
        await threadsData.set(threadID, false, "settings.isSleep");
      }, sleepDuration);

    } else {
      return api.sendMessage("Usage: !sleep mode on", threadID, messageID);
    }
  },

  // This part checks if the bot should reply or not
  onChat: async function ({ event, threadsData }) {
    const { threadID } = event;
    const threadSettings = await threadsData.get(threadID, "settings");

    if (threadSettings && threadSettings.isSleep) {
      // If sleep mode is on, stop command execution
      return false; 
    }
  }
};
