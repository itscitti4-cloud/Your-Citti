const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const config = {
  name: "autodl",
  version: "3.0.0",
  author: "AkHi",
  countDown: 5,
  role: 0,
  description: "Auto download video/photo from TikTok, FB, IG, YT, Twitter, and more without watermark.",
  category: "media",
  guide: {
    en: "Just paste the link, and the bot will automatically download the media."
  }
};

const onChat = async ({ api, event, threadsData }) => {
  const { body, threadID, messageID } = event;
  if (!body) return;

  const urlPatterns = [
    "tiktok.com", "facebook.com", "instagram.com", "youtu.be", "youtube.com",
    "twitter.com", "x.com", "pin.it", "fb.watch", "reel"
  ];

  if (urlPatterns.some(p => body.includes(p))) {
    try {
      // ⌛ React while processing
      await api.setMessageReaction("⌛", messageID, () => {}, true);
      
      const waitingMsg = await api.sendMessage("Please wait, I'm fetching your media... 📥", threadID);

      // Using a high-quality all-in-one downloader API
      const res = await axios.get(`https://api.diptos.me/alldl?url=${encodeURIComponent(body)}`);
      const data = res.data;

      if (!data.result) {
        throw new Error("Could not find a valid download link.");
      }

      const mediaUrl = data.result;
      const isVideo = !mediaUrl.match(/\.(jpg|jpeg|png)$/i);
      const ext = isVideo ? ".mp4" : ".jpg";
      const fileName = `autodl_${Date.now()}${ext}`;
      const filePath = path.join(__dirname, 'cache', fileName);

      if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
      }

      // Download file
      const fileStream = await axios.get(mediaUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(fileStream.data, "binary"));

      // ✅ React when download starts sending
      await api.setMessageReaction("✅", messageID, () => {}, true);
      await api.unsendMessage(waitingMsg.messageID);

      await api.sendMessage({
        body: `✅ | Downloaded Successfully!\n\n${data.cp || "Here is your requested media."}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);

    } catch (err) {
      // ❌ React on error
      await api.setMessageReaction("❌", messageID, () => {}, true);
      console.error(err);
      api.sendMessage(`❌ | Error: ${err.message || "Failed to download media. The link might be private or unsupported."}`, threadID, messageID);
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
