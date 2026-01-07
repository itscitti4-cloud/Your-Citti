const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult"],
    version: "4.0.0",
    author: "AkHi & Nawab",
    countDown: 5,
    role: 1, 
    description: "Detects Adult content and takes strict action.",
    category: "admin",
    guide: "{p}18+detector on | off"
  },

  // Goatbot এ ইভেন্ট হ্যান্ডল করার জন্য 'onChat' ইভেন্টটি সবচেয়ে বেশি কার্যকর
  onChat: async function ({ api, event, threadsData, usersData }) {
    const { threadID, senderID, attachments, messageID } = event;

    // যদি মিডিয়া না থাকে বা বট নিজে পাঠায় তবে স্কিপ করবে
    if (!attachments || attachments.length === 0 || senderID === api.getCurrentUserID()) return;

    // ডাটাবেজ থেকে চেক করা হচ্ছে এই গ্রুপে ডিটেক্টর অন কি না
    const threadInfo = await threadsData.get(threadID) || {};
    if (!threadInfo.nsfwDetector) return;

    // Sightengine API Credentials
    const api_user = '839186748'; 
    const api_secret = '6g4CMAaBUNPEBmqf5RRjJ4qZ2V8qD5gC'; 

    for (const attachment of attachments) {
      if (attachment.type === "photo") {
        try {
          // ইমেজ ইউআরএল প্রসেসিং
          const imgUrl = attachment.url;
          
          // API Call - সরাসরি লিঙ্কের মাধ্যমে (দ্রুত কাজ করার জন্য)
          const check = await axios.get('https://api.sightengine.com/1.0/check.json', {
            params: {
              'url': imgUrl,
              'models': 'nudity-2.0',
              'api_user': api_user,
              'api_secret': api_secret
            }
          });

          const res = check.data;
          
          if (res.status === "success" && res.nudity) {
            const n = res.nudity;
            // স্কোর চেক - আপনার স্ক্রিনশটের মতো হার্ডকোর ইমেজের জন্য এই লজিকটি পারফেক্ট
            if (n.sexual_display >= 0.50 || n.erotica >= 0.50 || n.sexual_activity >= 0.50) {
              
              // ১. মেসেজ আনসেন্ড (ডিলিট)
              await api.unsendMessage(messageID);
              
              // ২. ওয়ার্নিং ও ইউজার ম্যানেজমেন্ট
              const user = await usersData.get(senderID) || {};
              if (!user.data) user.data = {};
              if (!user.data.warnNSFW) user.data.warnNSFW = {};
              if (!user.data.warnNSFW[threadID]) user.data.warnNSFW[threadID] = 0;

              user.data.warnNSFW[threadID] += 1;
              const currentWarn = user.data.warnNSFW[threadID];

              if (currentWarn >= 2) {
                await api.sendMessage(`🚫 | Group Security: User removed for repeated adult content violations.`, threadID);
                api.removeUserFromGroup(senderID, threadID);
                user.data.warnNSFW[threadID] = 0; 
              } else {
                const name = user.name || "User";
                api.sendMessage({
                  body: `🛑 RED ALERT ❌\nAdult Content Detected! [Warning ${warnCount}/2]\nUser: ${name}\n\nYour message was deleted. Next time you will be kicked!`,
                  mentions: [{ tag: name, id: senderID }]
                }, threadID);
              }
              await usersData.set(senderID, user);
            }
          }
        } catch (err) {
          console.error("Adult Detector Error:", err.message);
        }
      }
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID } = event;
    const data = await threadsData.get(threadID) || {};

    if (args[0] === "on") {
      data.nsfwDetector = true;
      await threadsData.set(threadID, data);
      return api.sendMessage("🛡️ | Adult Content Detector has been ACTIVATED successfully.", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("⚠️ | Adult Content Detector has been DEACTIVATED.", threadID);
    }
    
    return api.sendMessage("Usage: !18+detector on/off", threadID);
  }
};
