const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "auto",
    version: "1.2.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "RapidAPI based auto video downloader",
    category: "media"
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("✅ AutoDownloader Active! Just send a link.", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    // সোশ্যাল মিডিয়া লিংক ডিটেক্ট করার রেজেক্স
    const linkMatch = body.match(/(https?:\/\/[^\s]+)/gi);
    if (!linkMatch) return;

    const url = linkMatch[0];

    // রিয়্যাকশন লোডিং বুঝানোর জন্য
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const options = {
      method: 'GET',
      url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
      params: { url: url },
      headers: {
        'x-rapidapi-key': '92f8a720b0mshaff9cbc8f3dfffdp13488fjsn8e426e828a2a',
        'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      
      // আপনার API রেসপন্স অনুযায়ী ভিডিও লিংক খুঁজে বের করা
      const medias = response.data.medias;
      if (!medias || medias.length === 0) return;

      // ভিডিও ফাইল ফিল্টার করা (mp4)
      const videoData = medias.find(m => m.extension === "mp4") || medias[0];
      const videoUrl = videoData.url;

      if (!videoUrl) return;

      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
      
      const filePath = path.join(cachePath, `video_${Date.now()}.mp4`);

      // ভিডিওটি স্ট্রীম করে ডাউনলোড করা
      const res = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      writer.on('finish', () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        api.sendMessage({
          body: `🎬 Title: ${response.data.title || "Auto Downloaded"}\n⏱️ Duration: ${response.data.duration || "N/A"}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      });

      writer.on('error', () => {
        api.setMessageReaction("❌", messageID, () => {}, true);
      });

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};
                            
