const axios = require('axios');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult"],
    version: "2.0.0",
    author: "AkHi and Nawab",
    countDown: 5,
    role: 1, // Admin & Bot Admin
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
      return api.sendMessage("✅ | 18+ Content Detector has been enabled. Members will be warned first and then kicked for violating rules.", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("❌ | 18+ Content Detector has been disabled.", threadID);
    }
  },

  onChat: async function ({ api, event, threadsData, usersData }) {
    const { threadID, senderID, attachments, messageID } = event;
    const data = await threadsData.get(threadID) || {};

    if (!data.nsfwDetector || attachments.length === 0) return;

    // Sightengine API Credentials
    const api_user = '839186748'; // Sample API User (Replace if needed)
    const api_secret = '6g4CMAaBUNPEBmqf5RRjJ4qZ2V8qD5gC'; 

    for (const attachment of attachments) {
      if (attachment.type === "photo" || attachment.type === "video") {
        const imageUrl = attachment.url;

        try {
          const res = await axios.get('https://api.sightengine.com/1.0/check.json', {
            params: {
              'url': imageUrl,
              'models': 'nudity-2.0',
              'api_user': api_user,
              'api_secret': api_secret
            }
          });

          const nsfwScore = res.data.nudity.sexual_display + res.data.nudity.erotica;

          if (nsfwScore > 0.5) { // 50% এর বেশি পর্নোগ্রাফিক সম্ভাবনা থাকলে
            await api.unsendMessage(messageID);
            
            const userData = await usersData.get(senderID) || {};
            if (!userData.warnCount) userData.warnCount = {};
            if (!userData.warnCount[threadID]) userData.warnCount[threadID] = 0;

            userData.warnCount[threadID] += 1;

            if (userData.warnCount[threadID] >= 2) {
              // ২য় বার অপরাধ করলে কিক
              await api.sendMessage("🚫 | Second violation detected. Removing user from the group.", threadID);
              api.removeUserFromGroup(senderID, threadID);
              userData.warnCount[threadID] = 0; // রিসেট
            } else {
              // ১ম বার সতর্কবার্তা
              api.sendMessage(`⚠️ | Warning! [1/2]\nUser: @${userData.name}\nReason: Sending 18+ content is strictly prohibited. Your message has been deleted.`, threadID, (err, info) => {
                if (!err) api.mention(senderID, threadID);
              });
            }
            await usersData.set(senderID, userData);
          }
        } catch (e) {
          console.error("NSFW Detector Error: ", e);
        }
      }
    }
  }
};
          
