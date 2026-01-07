const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "adult_detector",
    aliases: ["18+", "adult"],
    version: "2.5.0",
    author: "AkHi and Nawab",
    countDown: 5,
    role: 1, 
    description: "Detects NSFW content by uploading the media to Sightengine API.",
    category: "box chat",
    guide: {
        en: "{p}18+detector on | off"
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID } = event;
    const data = await threadsData.get(threadID) || {};

    if (args[0] === "on") {
      data.nsfwDetector = true;
      await threadsData.set(threadID, data);
      return api.sendMessage("✅ | 18+ Content Detector has been enabled.", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("❌ | 18+ Content Detector has been disabled.", threadID);
    }
  },

  onChat: async function ({ api, event, threadsData, usersData }) {
    const { threadID, senderID, attachments, messageID } = event;
    if (!attachments || attachments.length === 0) return;

    const data = await threadsData.get(threadID) || {};
    if (!data.nsfwDetector) return;

    // Sightengine API Credentials
    const api_user = '839186748'; 
    const api_secret = '6g4CMAaBUNPEBmqf5RRjJ4qZ2V8qD5gC'; 

    for (const attachment of attachments) {
      if (attachment.type === "photo") {
        try {
          // ইমেজটি ডাউনলোড করে স্ট্রিম হিসেবে নেওয়া
          const imageStream = (await axios.get(attachment.url, { responseType: 'stream' })).data;

          const form = new FormData();
          form.append('media', imageStream);
          form.append('models', 'nudity-2.0');
          form.append('api_user', api_user);
          form.append('api_secret', api_secret);

          const response = await axios.post('https://api.sightengine.com/1.0/check.json', form, {
            headers: form.getHeaders()
          });

          const nsfwData = response.data;
          let isNSFW = false;

          if (nsfwData.status === "success") {
            const nudity = nsfwData.nudity;
            // স্কোর চেক
            if (nudity.sexual_display >= 0.50 || nudity.erotica >= 0.50 || nudity.sexting >= 0.50) {
              isNSFW = true;
            }
          }

          if (isNSFW) {
            // মেসেজ আনসেন্ড করা
            await api.unsendMessage(messageID);
            
            const user = await usersData.get(senderID) || {};
            if (!user.data) user.data = {};
            if (!user.data.warnNSFW) user.data.warnNSFW = {};
            if (!user.data.warnNSFW[threadID]) user.data.warnNSFW[threadID] = 0;

            user.data.warnNSFW[threadID] += 1;
            const currentWarn = user.data.warnNSFW[threadID];

            if (currentWarn >= 2) {
              await api.sendMessage(`🚫 | User ID: ${senderID}\nSecond violation. Removing from group.`, threadID);
              api.removeUserFromGroup(senderID, threadID);
              user.data.warnNSFW[threadID] = 0; 
            } else {
              const name = (await usersData.get(senderID)).name || "User";
              api.sendMessage({
                body: `⚠️ | Warning [${currentWarn}/2]\nUser: ${name}\nReason: NSFW content detected. Message deleted.`,
                mentions: [{ tag: name, id: senderID }]
              }, threadID);
            }
            await usersData.set(senderID, user);
          }
        } catch (error) {
          console.error("NSFW Detector Error:", error.message);
        }
      }
    }
  }
};
