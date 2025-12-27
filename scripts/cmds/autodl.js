const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "autodl",
    version: "1.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Auto download video from FB, Insta, TikTok, YT, Twitter, Threads",
    category: "media",
    guide: {
      en: "{p}autodl [link]"
    }
  },

  onStart: async function ({ api, event, args }) {
    const link = args[0] || event.body;
    if (!link || !link.startsWith("http")) return;

    api.setMessageReaction("⌛", event.messageID, () => {}, true);
    const waitMsg = await api.sendMessage("Processing your video, please wait...", event.threadID, event.messageID);

    try {
      let videoUrl = null;

      // API 1: (Latest All-in-One Downloader)
      try {
        const res = await axios.get(`https://api.giftedtech.my.id/api/download/all-dl?url=${encodeURIComponent(link)}`);
        if (res.data.success) {
          videoUrl = res.data.result.video_url || res.data.result.url;
        }
      } catch (e) {}

      // Backup API 2: (Ayan API)
      if (!videoUrl) {
        try {
          const res2 = await axios.get(`https://api.ayan-official.repl.co/api/downloader/fbdl?url=${encodeURIComponent(link)}`);
          videoUrl = res2.data.result;
        } catch (e) {}
      }

      if (!videoUrl) throw new Error("Could not fetch video URL");

      const filePath = path.join(__dirname, 'cache', `${Date.now()}.mp4`);
      
      // ভিডিও ডাউনলোড করার সময় স্ট্রিমিং ব্যবহার করা ভালো
      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream'
      });

      fs.ensureDirSync(path.join(__dirname, 'cache'));
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', async () => {
        await api.sendMessage({
          body: `✅ Download Successful!\n👤 Author: AkHi`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID);

        api.setMessageReaction("✅", event.messageID, () => {}, true);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.unsendMessage(waitMsg.messageID);
      });

      writer.on('error', (err) => { throw err; });

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("Sorry, the video could not be downloaded. This happens if the link is private or the server is down.", event.threadID, event.messageID);
      api.unsendMessage(waitMsg.messageID);
    }
  },

  onChat: async function ({ api, event }) {
    if (!event.body) return;
    const regex = /(https?:\/\/(?:www\.)?(facebook|fb|instagram|tiktok|youtube|youtu|twitter|x|threads|reels)\.com\/\S+|https?:\/\/fb\.watch\/\S+|https?:\/\/www\.facebook\.com\/share\/\S+)/ig;
    const match = event.body.match(regex);
    if (match && !event.body.startsWith("!")) { // ! থাকলে autodl কমান্ড কাজ করবে, নাহলে অটো হবে
      this.onStart({ api, event, args: [match[0]] });
    }
  }
};
