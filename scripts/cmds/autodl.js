const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports = {
  config: {
    name: "auto",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Always active auto video download for any URL",
    category: "media"
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("✅ AutoLink Is running", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const linkMatch = body.match(/(https?:\/\/[^\s]+)/);
    if (!linkMatch) return;

    const url = linkMatch[0];

    try {
      // API Config Fetch
      const apiConfig = await axios.get(nix);
      const apiUrl = apiConfig.data && apiConfig.data.api;
      if (!apiUrl) return;

      // Reaction and Processing
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const res = await axios.get(`${apiUrl}/alldl?url=${encodeURIComponent(url)}`);
      const data = res.data.data || {};
      const videoUrl = data.videoUrl || data.high || data.low;

      if (!videoUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return;
      }

      // File Path for Temporary Video
      const videoPath = path.join(__dirname, `video_${threadID}_${messageID}.mp4`);

      // Download Video using Axios
      const videoRes = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(videoPath);
      videoRes.data.pipe(writer);

      writer.on('finish', () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        api.sendMessage({
          body: "════『 AUTODL 』════\n\n✨ Here's your video! ✨",
          attachment: fs.createReadStream(videoPath)
        }, threadID, () => {
          // Delete file after sending
          if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
          }
        });
      });

      writer.on('error', (err) => {
        console.error("Stream Error:", err);
        api.sendMessage("❌ Error while saving the video.", threadID, messageID);
      });

    } catch (err) {
      console.error("AutoDL Error:", err);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};
