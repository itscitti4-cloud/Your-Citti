const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "autodl",
    version: "1.0.0",
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

      // API 1: (Stable for Facebook & Reels)
      try {
        const res1 = await axios.get(`https://api.samirxpikachu.run/api/videofieri?url=${encodeURIComponent(link)}`);
        videoUrl = res1.data.videoUrl || res1.data.url;
      } catch (e) {}

      // API 2: (Backup for all platforms)
      if (!videoUrl) {
        try {
          const res2 = await axios.get(`https://api.vkrhost.in/api/download?url=${encodeURIComponent(link)}`);
          videoUrl = res2.data.data.url || res2.data.data.medias[0].url;
        } catch (e) {}
      }

      if (!videoUrl) throw new Error("Video URL not found");

      const filePath = path.join(__dirname, 'cache', `${Date.now()}.mp4`);
      const videoStream = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      
      fs.ensureDirSync(path.join(__dirname, 'cache'));
      fs.writeFileSync(filePath, Buffer.from(videoStream.data, 'binary'));

      await api.sendMessage({
        body: `✅ Download Successful!\n👤 Author: AkHi`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      fs.unlinkSync(filePath);
      api.unsendMessage(waitMsg.messageID);

    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("Sorry, the video could not be downloaded. The link might be private, or all server APIs are currently busy.", event.threadID, event.messageID);
      api.unsendMessage(waitMsg.messageID);
    }
  },

  onChat: async function ({ api, event }) {
    if (!event.body) return;
    const regex = /(https?:\/\/(?:www\.)?(facebook|fb|instagram|tiktok|youtube|youtu|twitter|x|threads)\.com\/\S+|https?:\/\/fb\.watch\/\S+|https?:\/\/www\.facebook\.com\/share\/\S+)/ig;
    const match = event.body.match(regex);
    if (match) {
      this.onStart({ api, event, args: [match[0]] });
    }
  }
};
