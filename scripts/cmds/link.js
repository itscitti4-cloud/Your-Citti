const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "link",
    aliases: ["mx", "player", "mxplayer"],
    version: "1.5.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    category: "utility",
    guide: "{pn} <link> (to play) or {pn} d <link> (to download)",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    let url, isDownload = args[0] === "d";
    url = isDownload ? args[1] : args[0];

    if (!url) {
      return api.sendMessage("❌ Please provide a valid video link. Example: !mx d https://link.com", threadID, messageID);
    }

    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

    api.sendMessage(isDownload ? "📥 Downloading..." : "🔍 Processing ad-free link...", threadID, messageID);

    // বর্তমান সময়ের সবচেয়ে সচল Cobalt API লিস্ট
    const apiEndpoints = [
      "https://api.cobalt.tools/api/json",
      "https://cobalt.canbeuseful.com/api/json",
      "https://api.v0.ovh/api/json",
      "https://cobalt.perennialte.ch/api/json"
    ];

    let success = false;
    let videoUrl = "";

    for (let endpoint of apiEndpoints) {
      try {
        const response = await axios.post(endpoint, {
          url: url,
          videoQuality: "720",
          isNoEndCards: true,
          downloadMode: isDownload
        }, {
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          timeout: 12000 
        });

        if (response.data && response.data.url) {
          videoUrl = response.data.url;
          success = true;
          break;
        }
      } catch (e) {
        console.error(`[MX-ERROR] Endpoint ${endpoint} failed:`, e.message);
        continue;
      }
    }

    if (!success) {
      return api.sendMessage("❌ Could not bypass the link. This site might be unsupported or all API nodes are down. Try again after a few minutes.", threadID, messageID);
    }

    try {
      const fileName = `mx_video_${Date.now()}.mp4`;
      const filePath = path.join(cachePath, fileName);

      const videoStream = await axios.get(videoUrl, { responseType: 'stream' });
      const writer = fs.createWriteStream(filePath);
      videoStream.data.pipe(writer);

      writer.on('finish', async () => {
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        if (fileSizeInMB > 25) {
          api.sendMessage(`🎬 **MX Player Playback**\n\n⚠️ Size: ${fileSizeInMB.toFixed(2)} MB (Too large to send).\n\n🔗 Ad-Free Link: ${videoUrl}`, threadID, messageID);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } else {
          const msg = {
            body: isDownload ? `✅ Downloaded!` : `🎬 **MX Player Mode**\n✅ Ad-free link processed.`,
            attachment: fs.createReadStream(filePath)
          };
          await api.sendMessage(msg, threadID, messageID);
          setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 2 * 60 * 60 * 1000);
        }
      });
    } catch (error) {
      return api.sendMessage("❌ Stream Error! The video source is restricted.", threadID, messageID);
    }
  }
};
