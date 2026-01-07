const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "18+detector",
    aliases: ["18+", "adult"],
    version: "3.0.0",
    author: "AkHi & Nawab",
    countDown: 5,
    role: 1, 
    description: "Detects NSFW content and takes strict action.",
    category: "admin",
    guide: "{p}18+detector on | off"
  },

  // এই ফাংশনটি প্রতিটি মেসেজ বা ইভেন্ট শোনার জন্য বাধ্যতামূলক
  handleEvent: async function ({ api, event, threadsData, usersData }) {
    const { threadID, senderID, attachments, messageID } = event;

    // যদি কোনো মিডিয়া না থাকে বা বট নিজে মেসেজ দেয় তবে রিটার্ন করবে
    if (!attachments || attachments.length === 0 || senderID === api.getCurrentUserID()) return;

    // থ্রেড ডাটা থেকে চেক করা হচ্ছে ডিটেক্টর অন আছে কি না
    const data = await threadsData.get(threadID) || {};
    if (!data.nsfwDetector) return;

    // Sightengine API Credentials
    const api_user = '839186748'; 
    const api_secret = '6g4CMAaBUNPEBmqf5RRjJ4qZ2V8qD5gC'; 

    for (const attachment of attachments) {
      if (attachment.type === "photo") {
        try {
          // ইমেজ ডাউনলোড এবং প্রসেসিং
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
          
          if (res.status === "success" && res.nudity) {
            const nudity = res.nudity;
            // স্কোর চেক (0.50 এর বেশি মানেই অ্যাডাল্ট কন্টেন্ট)
            if (nudity.sexual_display >= 0.50 || nudity.erotica >= 0.50 || nudity.sexting >= 0.50) {
              
              // ১. মেসেজ ডিলিট (unsendMessage)
              await api.unsendMessage(messageID);
              
              // ২. ওয়ার্নিং সিস্টেম
              const user = await usersData.get(senderID) || {};
              if (!user.data) user.data = {};
              if (!user.data.warnNSFW) user.data.warnNSFW = {};
              if (!user.data.warnNSFW[threadID]) user.data.warnNSFW[threadID] = 0;

              user.data.warnNSFW[threadID] += 1;
              const warnCount = user.data.warnNSFW[threadID];

              if (warnCount >= 2) {
                await api.sendMessage(`🚫 | Removing ID: ${senderID} for second-time adult content violation.`, threadID);
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
        } catch (error) {
          console.error("18+ Detector Event Error:", error.message);
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
      return api.sendMessage("🛡️ | Adult Content Detector has been ACTIVATED.", threadID);
    }

    if (args[0] === "off") {
      data.nsfwDetector = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("⚠️ | Adult Content Detector has been DEACTIVATED.", threadID);
    }
    
    return api.sendMessage("Usage: !18+detector on/off", threadID);
  }
};
