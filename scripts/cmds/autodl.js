const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const config = {
  name: "autodl",
  version: "4.0.0",
  author: "AkHi",
  countDown: 5,
  role: 0,
  description: "Auto download media from TikTok, FB, IG, YT without watermark using Cobalt API.",
  category: "media",
  guide: {
    en: "Just send any social media link."
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
      // ⌛ Reaction
      await api.setMessageReaction("⌛", messageID, () => {}, true);
      const waitingMsg = await api.sendMessage("Downloading your media, please wait... 😘", threadID);

      // Using a stable Cobalt instance API
      // Note: If this instance fails, you can replace the URL with another Cobalt worker.
      const response = await axios.post('https://cobalt.lucasvtiradentes.com/api/json', {
        url: body,
        vQuality: "720",
        isAudioOnly: false,
        removeWatermark: true
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      if (data.status === "error") {
        throw new Error(data.text || "Unknown error occurred.");
      }

      // If multiple files (like Instagram slide), we take the first one or handle accordingly
      const mediaUrl = data.url || (data.picker && data.picker[0].url);
      
      if (!mediaUrl) {
        throw new Error("Could not extract media URL.");
      }

      const ext = mediaUrl.includes(".jpg") || mediaUrl.includes(".png") ? ".jpg" : ".mp4";
      const fileName = `autodl_${Date.now()}${ext}`;
      const filePath = path.join(__dirname, 'cache', fileName);

      if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
      }

      // Download the file
      const fileData = await axios.get(mediaUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(fileData.data, "binary"));

      // ✅ Success Reaction
      await api.setMessageReaction("✅", messageID, () => {}, true);
      await api.unsendMessage(waitingMsg.messageID);

      await api.sendMessage({
        body: `✅ | Successfully downloaded!\n\nEnjoy your video without watermark <😘`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (err) {
      // ❌ Error Reaction
      await api.setMessageReaction("❌", messageID, () => {}, true);
      console.error(err);
      api.sendMessage(`❌ | Error: ${err.response?.data?.text || err.message || "Failed to process request."}`, threadID, messageID);
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
