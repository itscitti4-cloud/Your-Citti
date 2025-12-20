const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "autodl",
    version: "1.0.5",
    author: "AkHi",
    countDown: 5,
    role: 0,
    category: "media",
    shortDescription: {
      en: "Auto download video from links"
    },
    longDescription: {
      en: "Automatically downloads videos from Facebook, TikTok, Instagram when a link is sent."
    },
    guide: {
      en: "Just send the link in group/inbox"
    }
  },

  // Goatbot-এ ইভেন্ট হ্যান্ডেল করার জন্য 'onChat' ব্যবহার করা বেশি কার্যকর
  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = body.match(urlRegex);

    if (!links) return;

    const videoLink = links[0];
    const supportedSites = ["tiktok.com", "facebook.com", "fb.watch", "instagram.com", "reels"];
    
    if (supportedSites.some(site => videoLink.includes(site))) {
      try {
        // ১. শুরুতে ⌛ রিঅ্যাক্ট
        await api.setMessageReaction("⌛", messageID, () => {}, true);

        // ২. এপিআই কল (Samir API আপডেট ফরম্যাট)
        const res = await axios.get(`https://api.samir.ltd/download/alldl?url=${encodeURIComponent(videoLink)}`);
        
        // এপিআই রেসপন্স চেক
        let videoUrl = res.data.result.url || res.data.result;
        if (!videoUrl) throw new Error("Video URL not found");

        // ৩. ফাইল সেভ করার লোকেশন
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        
        const videoPath = path.join(cacheDir, `${Date.now()}.mp4`);
        const videoData = (await axios.get(videoUrl, { responseType: 'arraybuffer' })).data;
        fs.writeFileSync(videoPath, Buffer.from(videoData, 'utf-8'));

        // ৪. ভিডিও সেন্ড করা
        await api.sendMessage({
          body: "AkHi Ma'am, Video downloaded successfully ✅",
          attachment: fs.createReadStream(videoPath)
        }, threadID, async (err) => {
          if (!err) {
            await api.setMessageReaction("✅", messageID, () => {}, true);
          } else {
            await api.setMessageReaction("❌", messageID, () => {}, true);
          }
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        });

      } catch (error) {
        console.error("Error in autodl:", error.message);
        await api.setMessageReaction("❌", messageID, () => {}, true);
      }
    }
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("এটি একটি অটো ডাউনলোডার। যেকোনো ভিডিও লিঙ্ক দিন, আমি ডাউনলোড করে দেব।", event.threadID, event.messageID);
  }
};
            
