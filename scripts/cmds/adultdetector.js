const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult", "nsfw"],
    version: "2.6.0",
    author: "AkHi & Nawab",
    countDown: 5,
    role: 1, 
    description: "Detects NSFW content and takes strict action.",
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
      return api.sendMessage("🛡️ | Adult Content Detector has been ACTIVATED. Strictly monitoring media...", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("⚠️ | Adult Content Detector has been DEACTIVATED.", threadID);
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
          // ইমেজটিকে বাফার (Buffer) হিসেবে ডাউনলোড করা
          const responseImage = await axios.get(attachment.url, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(responseImage.data, 'utf-8');

          const form = new FormData();
          form.append('media', buffer, { filename: 'media.jpg' });
          form.append('models', 'nudity-2.0');
          form.append('api_user', api_user);
          form.append('api_secret', api_secret);

          const checkNSFW = await axios.post('https://api.sightengine.com/1.0/check.json', form, {
            headers: form.getHeaders()
          });

          const nsfwResult = checkNSFW.data;
          let violationDetected = false;

          if (nsfwResult.status === "success") {
            const n = nsfwResult.nudity;
            // স্কোর চেক (০.৫০ বা তার বেশি হলে পর্নোগ্রাফি হিসেবে গণ্য হবে)
            if (n.sexual_display >= 0.50 || n.erotica >= 0.50 || n.sexting >= 0.50) {
              violationDetected = true;
            }
          }

          if (violationDetected) {
            // ১. তৎক্ষণাৎ ডিলিট
            await api.unsendMessage(messageID);
            
            // ২. ইউজার ডাটা চেক এবং ব্যবস্থা নেওয়া
            const userData = await usersData.get(senderID) || {};
            if (!userData.warnNSFW) userData.warnNSFW = {};
            if (!userData.warnNSFW[threadID]) userData.warnNSFW[threadID] = 0;

            userData.warnNSFW[threadID] += 1;
            const count = userData.warnNSFW[threadID];

            if (count >= 2) {
              await api.sendMessage(`🚫 | Removing @${userData.name || "User"} due to repeated ADULT violations.`, threadID);
              api.removeUserFromGroup(senderID, threadID);
              userData.warnNSFW[threadID] = 0; 
            } else {
              const name = userData.name || "User";
              api.sendMessage({
                body: `⚠️ RED ALERT ❌\nAdult Content Detect! [Warning ${count}/2]\nUser: ${name}\nViolation: Sharing explicit content.\n\nYour message was automatically deleted. Another violation will result in a kick.`,
                mentions: [{ tag: name, id: senderID }]
              }, threadID);
            }
            await usersData.set(senderID, userData);
          }
        } catch (err) {
          console.error("Sightengine Error:", err.message);
        }
      }
    }
  }
};
