const axios = require("axios");

module.exports = {
  config: {
    name: "photo",
    aliases: ["pic", "picture"],
    version: "2.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "URL to Picture. profile link to profile picture. (FB, Insta, TikTok, Twitter, Threads)",
    category: "media",
    guide: "!pic [link]",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const url = args[0];

    if (!url) {
      return api.sendMessage("Please enter your correct URL (FB, Insta, TikTok, Twitter, or Threads)।", threadID, messageID);
    }

    api.sendMessage("Processing", threadID, messageID);

    try {
      // Using a more stable multi-downloader API
      const res = await axios.get(`https://lianeapi.onrender.com/@nealiane/api/allinone?url=${encodeURIComponent(url)}`);
      const data = res.data;

      // Attachment array to store image streams
      const attachments = [];

      // Check for images in post or profile picture
      const mediaSources = data.images || (data.picture ? [data.picture] : []);

      if (mediaSources.length === 0) {
        return api.sendMessage("❌ Sorry, Picture not found from the URL", threadID, messageID);
      }

      for (const imgUrl of mediaSources) {
        try {
          const imageStream = await api.httpGet(imgUrl, { responseType: "stream" });
          attachments.push(imageStream.data);
        } catch (e) {
          console.error("Error fetching individual image:", e);
        }
      }

      if (attachments.length === 0) {
        return api.sendMessage("❌ Sorry, Picture not found from the URL", threadID, messageID);
      }

      return api.sendMessage({
        body: `✅ That's your requested picture 🌸(HD Quality)`,
        attachment: attachments
      }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("⚠️ API is Death", threadID, messageID);
    }
  }
};
