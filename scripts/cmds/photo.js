const axios = require("axios");

module.exports = {
  config: {
    name: "photo",
    aliases: ["pic", "picture"],
    version: "2.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "URL to Picture using your own API (FB, Insta, TikTok, Twitter, Threads)",
    category: "media",
    guide: "!pic [link]",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const url = args[0];

    if (!url) {
      return api.sendMessage("⚠️ Please enter a correct URL (FB, Insta, TikTok, Twitter, or Threads).", threadID, messageID);
    }

    api.sendMessage("Processing, please wait... ⏳", threadID, messageID);

    try {
      // --- আপনার Render API লিঙ্কটি এখানে দিন ---
      const yourApiUrl = "https://nawab-api.onrender.com"; 
      
      // আপনার নিজস্ব এপিআই এন্ডপয়েন্টে কল করা হচ্ছে
      const res = await axios.get(`https://nawab-api.onrender.com/api/photo?url=${encodeURIComponent(url)}`);
      const data = res.data;

      const attachments = [];

      // এপিআই থেকে পাওয়া ইমেজ সোর্সগুলো চেক করা (images array অথবা picture string)
      const mediaSources = data.images || (data.picture ? [data.picture] : []);

      if (mediaSources.length === 0) {
        return api.sendMessage("❌ Sorry, no picture found from this URL.", threadID, messageID);
      }

      // ইমেজ ইউআরএলগুলো থেকে স্ট্রিম তৈরি করা
      for (const imgUrl of mediaSources) {
        try {
          const imageStream = await api.httpGet(imgUrl, { responseType: "stream" });
          attachments.push(imageStream.data);
        } catch (e) {
          console.error("Error fetching image stream:", e.message);
        }
      }

      if (attachments.length === 0) {
        return api.sendMessage("❌ Could not process the images from the URL.", threadID, messageID);
      }

      return api.sendMessage({
        body: `✅ Your requested media is ready! 🌸`,
        attachment: attachments
      }, threadID, messageID);

    } catch (error) {
      console.error("Photo Command Error:", error.message);
      return api.sendMessage("⚠️ Your API server is not responding. Please check your dashboard.", threadID, messageID);
    }
  }
};
