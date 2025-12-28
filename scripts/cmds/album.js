const axios = require("axios");
const path = require("path");
const fs = require("fs");

const baseApiUrl = async () => {
  try {
    const base = await axios.get(
      `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`,
    );
    return base.data.api;
  } catch (e) {
    return "https://mahabub-video-api-we90.onrender.com"; // ব্যাকআপ লিঙ্ক যদি মেইন লিঙ্ক কাজ না করে
  }
};

module.exports = {
  config: {
    name: "album",
    version: "1.0.1",
    role: 0,
    author: "AkHi", 
    description: "Displays album options for selection.",
    category: "Media",
    countDown: 5,
    guide: {
      en: "{p}{n} or add [category name]",
    },
  },

  onStart: async function ({ api, event, args }) {
    // আগের কোড ঠিক আছে, শুধু API কল চেক করুন
    if (!args[0] || args[0] === "2") {
       api.setMessageReaction("⌛", event.messageID, () => {}, true);
       // ... মেনু ডিসপ্লে কোড ...
       // (আপনার আগের মেনু কোড এখানে বসবে)
    }
    // ... অন্যান্য লজিক ...
  },

  onReply: async function ({ api, event, Reply }) {
    const admin = "100044327656712";
    // reply logic... (Keep the previous mappings)
    
    try {
      const apiUrl = await baseApiUrl();
      const res = await axios.get(`${apiUrl}/album?type=${query}`);
      
      // ডাটা চেক করার জন্য নতুন লজিক
      if (!res.data || !res.data.data) {
        return api.sendMessage(
          "❌ API didn't return a video link. The server might be busy. Try again later.",
          event.threadID,
          event.messageID
        );
      }

      const imgUrl = res.data.data;
      const imgRes = await axios.get(imgUrl, { 
        responseType: "arraybuffer", 
        headers: { 'User-Agent': 'Mozilla/5.0' } 
      });

      const filename = __dirname + `/assets/dipto_${Date.now()}.mp4`;
      
      if (!fs.existsSync(__dirname + '/assets')) {
        fs.mkdirSync(__dirname + '/assets');
      }

      fs.writeFileSync(filename, Buffer.from(imgRes.data, "binary"));
      
      api.sendMessage(
        {
          body: `${cp}\n\n𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗨𝗿𝗹: ${imgUrl}`,
          attachment: fs.createReadStream(filename),
        },
        event.threadID,
        () => fs.unlinkSync(filename),
        event.messageID
      );

    } catch (error) {
      console.error(error);
      api.sendMessage(
        "⚠️ Server Error: সরাসরি ভিডিও পাওয়া যাচ্ছে না। কিছুক্ষণ পর চেষ্টা করুন।",
        event.threadID,
        event.messageID
      );
    }
  },
};
          
