module.exports = {
  config: {
    name: "sleep",
    version: "1.1.0",
    author: "AkHi / Gemini AI",
    countDown: 5,
    role: 2, 
    description: "Turn off bot replies for 10 minutes in the current group",
    category: "admin",
    guide: "{pn} mode on"
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID, messageID } = event;
    const mode = args[0]?.toLowerCase();

    if (mode === "mode" && args[1]?.toLowerCase() === "on") {
      const sleepDuration = 10 * 60 * 1000; // 10 minutes

      // Save sleep mode to database
      await threadsData.set(threadID, true, "settings.isSleep");

      api.sendMessage("💤 Sleep mode is now ON! The bot will not reply to any commands in this group for the next 10 minutes.", threadID, messageID);

      // Automatically turn off after specific time
      setTimeout(async () => {
        const currentStatus = await threadsData.get(threadID, "settings.isSleep");
        if (currentStatus) {
          await threadsData.set(threadID, false, "settings.isSleep");
          api.sendMessage("⏰ 10 minutes are up! Sleep mode is now OFF. The bot is back to work.", threadID);
        }
      }, sleepDuration);

    } else if (mode === "mode" && args[1]?.toLowerCase() === "off") {
        await threadsData.set(threadID, false, "settings.isSleep");
        return api.sendMessage("✅ Sleep mode has been manually turned OFF.", threadID, messageID);
    } else {
      return api.sendMessage("Usage: sleep mode on OR sleep mode off", threadID, messageID);
    }
  },

  // This part checks every message
  onChat: async function ({ event, threadsData, api }) {
    const { threadID, body } = event;
    
    // Check status from database
    const isSleep = await threadsData.get(threadID, "settings.isSleep");

    if (isSleep === true) {
      // Allow execution only if the user types 'sleep mode off'
      if (body && body.toLowerCase().startsWith("sleep mode off")) {
          return; 
      }
      
      // Stop command execution during sleep mode
      return event.stop(); 
    }
  }
};
