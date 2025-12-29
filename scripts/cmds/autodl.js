const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const config = {
  name: "autodl",
  version: "5.0.0",
  author: "AkHi",
  countDown: 5,
  role: 0,
  description: "Advanced Auto Downloader for TikTok, FB, IG, YT (No Watermark).",
  category: "media",
  guide: {
    en: "Simply send the link in the chat."
  }
};

const onChat = async ({ api, event }) => {
  const { body, threadID, messageID } = event;
  if (!body) return;

  const urlPatterns = [
    "tiktok.com", "facebook.com", "instagram.com", "youtu.be", "youtube.com",
    "twitter.com", "x.com", "pin.it", "fb.watch", "reel"
  ];

  if (urlPatterns.some(p => body.includes(p))) {
    try {
      // ⌛ Status Reaction
      await api.setMessageReaction("⌛", messageID, () => {}, true);
      const waitingMsg = await api.sendMessage("Checking link and fetching media... 😘", threadID);

      // Using a very stable and multi-purpose API endpoint
      const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(body)}`);
      
      let mediaUrl;
      let title = "No Title";

      // TikTok No Watermark Logic
      if (body.includes("tiktok.com")) {
        mediaUrl = response.data.video?.noWatermark || response.data.video?.url;
        title = response.data.title || "TikTok Video";
      } else {
        // Fallback for other platforms using another stable API
        const altRes = await axios.get(`https://api.botcahx.eu.org/api/dowloader/alldl?url=${encodeURIComponent(body)}&apikey=akhi123`);
        mediaUrl = altRes.data.result?.url || altRes.data.result;
      }

      if (!mediaUrl) throw new Error("Could not find a working download link.");

      const ext = mediaUrl.includes(".jpg") || mediaUrl.includes(".png") ? ".jpg" : ".mp4";
      const filePath = path.join(__dirname, 'cache', `autodl_${Date.now()}${ext}`);

      if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
      }

      const fileData = await axios.get(mediaUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(fileData.data, "binary"));

      // ✅ Success Reaction
      await api.setMessageReaction("✅", messageID, () => {}, true);
      await api.unsendMessage(waitingMsg.messageID);

      await api.sendMessage({
        body: `✅ | Success!\n\nTitle: ${title}\nDownloaded without watermark. Enjoy! <😘`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (err) {
      // ❌ Error Reaction
      await api.setMessageReaction("❌", messageID, () => {}, true);
      console.error(err);
      api.sendMessage(`❌ | Server Busy or Link Private!\n\nPlease try again later or use a different link.`, threadID, messageID);
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
