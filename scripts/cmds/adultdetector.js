const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult"],
    version: "9.0.0",
    author: "AkHi & Nawab",
    countDown: 5,
    role: 1, 
    description: "Detects NSFW content using DeepAI.",
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

      // DeepAI API Key (Get it from deepai.org)
      const DEEPAI_KEY = '48f12782-ad9b-48eb-bae9-73651495beeb'; 

      for (const attachment of attachments) {
        if (attachment.type === "photo") {
          const form = new FormData();
          form.append('image', attachment.url);

          const response = await axios.post('https://api.deepai.org/api/nsfw-detector', form, {
            headers: {
              'api-key': DEEPAI_KEY,
              ...form.getHeaders()
            }
          });

          const res = response.data;
          // DeepAI output provides an nsfw_score (0 to 1)
          if (res.output && res.output.nsfw_score > 0.7) {
            
            await api.unsendMessage(messageID);
            
            const userData = await usersData.get(senderID) || {};
            if (!userData.data) userData.data = {};
            if (!userData.data.warnNSFW) userData.data.warnNSFW = {};
            if (!userData.data.warnNSFW[threadID]) userData.data.warnNSFW[threadID] = 0;

            userData.data.warnNSFW[threadID] += 1;
            const currentWarn = userData.data.warnNSFW[threadID];

            if (currentWarn >= 2) {
              await api.sendMessage(`🚫 | Kicked! User ID: ${senderID}\nRemoved due to repeated NSFW violations.`, threadID);
              api.removeUserFromGroup(senderID, threadID);
              userData.data.warnNSFW[threadID] = 0; 
            } else {
              const name = userData.name || "User";
              api.sendMessage({
                body: `🛑 NSFW DETECTED! [Warning ${currentWarn}/2]\nUser: ${name}\nYour message has been deleted. Another violation will result in a kick.`,
                mentions: [{ tag: name, id: senderID }]
              }, threadID);
            }
            await usersData.set(senderID, userData);
          }
        }
      }
    } catch (error) {
      console.error("DeepAI Error:", error.message);
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID } = event;
    const data = await threadsData.get(threadID) || {};

    if (args[0] === "on") {
      data.nsfwDetector = true;
      await threadsData.set(threadID, data);
      return api.sendMessage("🛡️ | 18+ Content Detector (DeepAI) has been ENABLED.", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("⚠️ | 18+ Content Detector (DeepAI) has been DISABLED.", threadID);
    }
    
    return api.sendMessage("Usage: !18+detector on/off", threadID);
  }
};
