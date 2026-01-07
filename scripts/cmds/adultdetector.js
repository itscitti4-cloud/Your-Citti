const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult"],
    version: "10.0.0",
    author: "AkHi & Nawab",
    countDown: 5,
    role: 1, 
    description: "NSFW detector using DeepAI API.",
    category: "admin",
    guide: {
        en: "{p}18+detector on | off"
    }
  },

  onChat: async function ({ api, event, threadsData, usersData }) {
    const { threadID, senderID, attachments, messageID } = event;
    if (!attachments || attachments.length === 0 || senderID === api.getCurrentUserID()) return;

    try {
      const threadData = await threadsData.get(threadID) || {};
      if (!threadData.nsfwDetector) return;

      const DEEPAI_KEY = '48f12782-ad9b-48eb-bae9-73651495beeb'; 

      for (const attachment of attachments) {
        if (attachment.type === "photo") {
          // রেন্ডার সার্ভারের জন্য বাফার সিস্টেম
          const imgRes = await axios.get(attachment.url, { responseType: 'arraybuffer' });
          const form = new FormData();
          form.append('image', Buffer.from(imgRes.data), { filename: 'image.jpg' });

          const response = await axios.post('https://api.deepai.org/api/nsfw-detector', form, {
            headers: {
              'api-key': DEEPAI_KEY,
              ...form.getHeaders()
            }
          });

          const res = response.data;
          // DeepAI score 0.5 এর উপরে হলে সেটা NSFW
          if (res.output && res.output.nsfw_score > 0.5) {
            
            // ১. ছবি ডিলিট করার চেষ্টা
            try {
               await api.unsendMessage(messageID);
            } catch (e) {
               console.log("Failed to unsend message - Bot might not be admin.");
            }
            
            // ২. ওয়ার্নিং ও কিক লজিক
            const userData = await usersData.get(senderID) || {};
            if (!userData.data) userData.data = {};
            if (!userData.data.warnNSFW) userData.data.warnNSFW = {};
            if (!userData.data.warnNSFW[threadID]) userData.data.warnNSFW[threadID] = 0;

            userData.data.warnNSFW[threadID] += 1;
            const currentWarn = userData.data.warnNSFW[threadID];

            if (currentWarn >= 2) {
              await api.sendMessage(`🚫 | Kicked! User: ${senderID}\nViolation: Repeatedly sharing explicit content.`, threadID);
              api.removeUserFromGroup(senderID, threadID);
              userData.data.warnNSFW[threadID] = 0; 
            } else {
              const name = userData.name || "User";
              api.sendMessage({
                body: `🛑 NSFW CONTENT DETECTED! [Warning ${currentWarn}/2]\nUser: ${name}\nYour message was deleted. Final warning!`,
                mentions: [{ tag: name, id: senderID }]
              }, threadID);
            }
            await usersData.set(senderID, userData);
          }
        }
      }
    } catch (error) {
      console.error("Critical Error:", error.message);
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID } = event;
    const data = await threadsData.get(threadID) || {};

    if (args[0] === "on") {
      data.nsfwDetector = true;
      await threadsData.set(threadID, data);
      return api.sendMessage("🛡️ | NSFW Detector (DeepAI) is now ACTIVE.", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("⚠️ | NSFW Detector (DeepAI) is now DISABLED.", threadID);
    }
    return api.sendMessage("Usage: !18+detector on/off", threadID);
  }
};
