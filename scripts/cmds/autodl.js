const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const config = {
  name: "autodl",
  version: "3.5.0",
  author: "AkHi",
  countDown: 5,
  role: 0,
  description: "Auto download video/photo from TikTok, FB, IG, YT, Twitter without watermark.",
  category: "media",
  guide: {
    en: "Just paste any social media link in the chat."
  }
};

const onChat = async ({ api, event }) => {
  const { body, threadID, messageID } = event;
  if (!body) return;

  // সাপোর্ট করা ওয়েবসাইট লিস্ট
  const urlPatterns = [
    "tiktok.com", "facebook.com", "instagram.com", "youtu.be", "youtube.com",
    "twitter.com", "x.com", "pin.it", "fb.watch", "reel"
  ];

  if (urlPatterns.some(p => body.includes(p))) {
    try {
      // ⌛ Processing Reaction
      await api.setMessageReaction("⌛", messageID, () => {}, true);
      
      const waitingMsg = await api.sendMessage("Wait Bby, I'm fetching your media... 😘", threadID);

      // বিকল্প API ব্যবহার করা হয়েছে (এটি সাধারণত বেশি স্টেবল থাকে)
      const res = await axios.get(`https://api.samir.pro/alldl?url=${encodeURIComponent(body)}`);
      
      const data = res.data;
      if (!data.url) {
        throw new Error("Sorry, I couldn't find the media link!");
      }

      const mediaUrl = data.url;
      const title = data.title || "No Title";
      
      // ফাইল এক্সটেনশন ডিটেক্ট করা
      let ext = ".mp4";
      if (mediaUrl.includes(".jpg") || mediaUrl.includes(".jpeg")) ext = ".jpg";
      if (mediaUrl.includes(".png")) ext = ".png";

      const fileName = `autodl_${Date.now()}${ext}`;
      const filePath = path.join(__dirname, 'cache', fileName);

      if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
      }

      // মিডিয়া ফাইল ডাউনলোড
      const fileStream = await axios.get(mediaUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(fileStream.data, "binary"));

      // ✅ Success Reaction
      await api.setMessageReaction("✅", messageID, () => {}, true);
      await api.unsendMessage(waitingMsg.messageID);

      await api.sendMessage({
        body: `✅ | Downloaded: ${title}\n\nEnjoy your media! <😘`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (err) {
      // ❌ Error Reaction
      await api.setMessageReaction("❌", messageID, () => {}, true);
      console.error(err);
      api.sendMessage(`❌ | Error: ${err.message || "Failed to download. Link might be private or broken."}`, threadID, messageID);
    }
  }
};

module.exports = {
  config,
  onChat,
  onStart: () => {},
  handleEvent: onChat,
  run: () => {}
};
