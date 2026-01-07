const axios = require('axios');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult"],
    version: "2.1.0",
    author: "AkHi and Nawab",
    countDown: 5,
    role: 1, 
    description: "Automatically detect NSFW/Adult content and take action (Warn/Kick).",
    category: "box chat",
    guide: "{p}18+detector on | off"
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID } = event;
    const data = await threadsData.get(threadID) || {};

    if (args[0] === "on") {
      data.nsfwDetector = true;
      await threadsData.set(threadID, data);
      return api.sendMessage("✅ | 18+ Content Detector has been enabled. Members will be warned first and then kicked for violations.", threadID);
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
      if (attachment.type === "photo" || attachment.type === "video") {
        try {
          // API Call (এটি ইমেজ এবং ভিডিও দুইটার লিঙ্কেই কাজ করবে nudity মডেলের জন্য)
          const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
            params: {
              'url': attachment.url,
              'models': 'nudity-2.0',
              'api_user': api_user,
              'api_secret': api_secret
            }
          });

          const nsfwData = response.data;
          let isNSFW = false;

          if (nsfwData.status === "success") {
            // NSFW স্কোর চেক (sexual_display বা erotica যদি ০.৫০ এর বেশি হয়)
            const nudity = nsfwData.nudity;
            if (nudity.sexual_display >= 0.50 || nudity.erotica >= 0.50 || nudity.sexting >= 0.50) {
              isNSFW = true;
            }
          }

          if (isNSFW) {
            // ১. মেসেজ সাথে সাথে ডিলিট
            await api.unsendMessage(messageID);
            
            // ২. ইউজার ডাটা চেক এবং ওয়ার্নিং
            const user = await usersData.get(senderID) || {};
            if (!user.data) user.data = {};
            if (!user.data.warnNSFW) user.data.warnNSFW = {};
            if (!user.data.warnNSFW[threadID]) user.data.warnNSFW[threadID] = 0;

            user.data.warnNSFW[threadID] += 1;
            const currentWarn = user.data.warnNSFW[threadID];

            if (currentWarn >= 2) {
              // ২য় বার হলে কিক
              await api.sendMessage(`🚫 | User ID: ${senderID}\nSecond violation detected. Removing user from group.`, threadID);
              api.removeUserFromGroup(senderID, threadID);
              user.data.warnNSFW[threadID] = 0; // রিসেট
            } else {
              // ১ম বার হলে ওয়ার্নিং
              const name = (await usersData.get(senderID)).name;
              api.sendMessage({
                body: `⚠️ | Warning [${currentWarn}/2]\nUser: ${name}\nReason: NSFW/18+ content detected. Your message has been deleted. Sending such content again will result in a kick.`,
                mentions: [{ tag: name, id: senderID }]
              }, threadID);
            }
            await usersData.set(senderID, user);
          }
        } catch (error) {
          console.error("18+ Detector Error:", error.message);
        }
      }
    }
  }
};
                                      
