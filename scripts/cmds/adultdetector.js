const axios = require('axios');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult"],
    version: "6.5.0",
    author: "AkHi & Nawab",
    countDown: 5,
    role: 1, 
    description: "Detects Adult content and takes action.",
    category: "admin",
    guide: {
        en: "{p}18+detector on | off"
    }
  },

  onChat: async function ({ api, event, threadsData, usersData }) {
    const { threadID, senderID, attachments, messageID } = event;

    if (!attachments || attachments.length === 0 || senderID === api.getCurrentUserID()) return;

    try {
      const threadData = await threadsData.get(threadID);
      if (!threadData || !threadData.nsfwDetector) return;

      const api_user = '839186748'; 
      const api_secret = '6g4CMAaBUNPEBmqf5RRjJ4qZ2V8qD5gC'; 

      for (const attachment of attachments) {
        if (attachment.type === "photo") {
          const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
            params: {
              'url': attachment.url,
              'models': 'nudity-2.0,wad,properties',
              'api_user': api_user,
              'api_secret': api_secret
            }
          });

          const res = response.data;

          if (res.status === "success") {
            const n = res.nudity;
            if (n.sexual_display >= 0.5 || n.erotica >= 0.5 || n.sexual_activity >= 0.3) {
              
              await api.unsendMessage(messageID);
              
              const userData = await usersData.get(senderID) || {};
              if (!userData.data) userData.data = {};
              if (!userData.data.warnNSFW) userData.data.warnNSFW = {};
              if (!userData.data.warnNSFW[threadID]) userData.data.warnNSFW[threadID] = 0;

              userData.data.warnNSFW[threadID] += 1;
              const currentWarn = userData.data.warnNSFW[threadID];

              if (currentWarn >= 2) {
                await api.sendMessage(`🚫 | Kicked! User ID: ${senderID}\nYou have been removed from the group for repeated Adult Content violations.`, threadID);
                api.removeUserFromGroup(senderID, threadID);
                userData.data.warnNSFW[threadID] = 0; 
              } else {
                const name = userData.name || "User";
                api.sendMessage({
                  body: `🛑RED ALERT❌\nNSFW CONTENT DETECTED! [Warning ${currentWarn}/2]\nUser: ${name}\nYour message has been deleted. Another violation will result in a kick.`,
                  mentions: [{ tag: name, id: senderID }]
                }, threadID);
              }
              await usersData.set(senderID, userData);
            }
          }
        }
      }
    } catch (error) {
      console.error("Adult Detector Error:", error.message);
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID } = event;
    const data = await threadsData.get(threadID) || {};

    if (args[0] === "on") {
      data.nsfwDetector = true;
      await threadsData.set(threadID, data);
      return api.sendMessage("🛡️ | Adult Content Detector has been ENABLED.", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("⚠️ | Adult Content Detector has been DISABLED.", threadID);
    }
    
    return api.sendMessage("Usage: !18+detector on/off", threadID);
  }
};
                  
