const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult"],
    version: "2.8.0",
    author: "AkHi & Nawab",
    countDown: 5,
    role: 1, 
    description: "Detects NSFW content and takes strict action.",
    category: "admin",
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
      return api.sendMessage("🛡️ | 18+ Content Detector has been ACTIVATED. Media monitoring is now live.", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("⚠️ | 18+ Content Detector has been DEACTIVATED.", threadID);
    }
  },

  // Goatbot v2 তে handleEvent প্রতিটি ইনকামিং মেসেজ স্ক্যান করতে বেশি কার্যকর
  handleEvent: async function ({ api, event, threadsData, usersData }) {
    const { threadID, senderID, attachments, messageID, type } = event;
    
    // মেসেজে অ্যাটাচমেন্ট না থাকলে বা এটি যদি সাধারণ মেসেজ না হয় তবে রিটার্ন করবে
    if (!attachments || attachments.length === 0 || senderID === api.getCurrentUserID()) return;

    const data = await threadsData.get(threadID) || {};
    if (!data.nsfwDetector) return;

    // Sightengine API Credentials
    const api_user = '839186748'; 
    const api_secret = '6g4CMAaBUNPEBmqf5RRjJ4qZ2V8qD5gC'; 

    for (const attachment of attachments) {
      if (attachment.type === "photo") {
        try {
          // ইমেজ ইউআরএল থেকে বাফার তৈরি
          const responseImage = await axios.get(attachment.url, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(responseImage.data, 'binary');

          const form = new FormData();
          form.append('media', buffer, { filename: 'check.jpg' });
          form.append('models', 'nudity-2.0');
          form.append('api_user', api_user);
          form.append('api_secret', api_secret);

          const checkNSFW = await axios.post('https://api.sightengine.com/1.0/check.json', form, {
            headers: form.getHeaders()
          });

          const res = checkNSFW.data;
          let isNSFW = false;

          if (res.status === "success" && res.nudity) {
            // পর্নোগ্রাফি স্কোর চেক
            if (res.nudity.sexual_display >= 0.50 || res.nudity.erotica >= 0.50 || res.nudity.sexting >= 0.50) {
              isNSFW = true;
            }
          }

          if (isNSFW) {
            // ১. আপনার API ফাংশন unsendMessage ব্যবহার করে ডিলিট
            await api.unsendMessage(messageID);
            
            // ২. ইউজার ডাটা আপডেট ও ওয়ার্নিং
            const user = await usersData.get(senderID) || {};
            if (!user.data) user.data = {};
            if (!user.data.warnNSFW) user.data.warnNSFW = {};
            if (!user.data.warnNSFW[threadID]) user.data.warnNSFW[threadID] = 0;

            user.data.warnNSFW[threadID] += 1;
            const warnCount = user.data.warnNSFW[threadID];

            if (warnCount >= 2) {
              await api.sendMessage(`🚫 | Removing ID: ${senderID} for repeated adult content violations.`, threadID);
              api.removeUserFromGroup(senderID, threadID);
              user.data.warnNSFW[threadID] = 0; 
            } else {
              const name = (await usersData.get(senderID)).name || "User";
              api.sendMessage({
                body: `⚠️ RED ALERT ❌\nAdult Content Detected! [Warning ${warnCount}/2]\nUser: ${name}\n\nYour message was deleted. Next violation will lead to a kick.`,
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
