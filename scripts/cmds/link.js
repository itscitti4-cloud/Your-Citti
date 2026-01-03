const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "link",
    aliases: ["mx", "player", "mxplayer"],
    version: "1.4.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    category: "utility",
    guide: "{pn} <link> (to play) or {pn} d <link> (to download)",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    
    let url, isDownload = false;

    if (args[0] === "d") {
      isDownload = true;
      url = args[1];
    } else {
      url = args[0];
    }

    if (!url) {
      return api.sendMessage("❌ Please provide a valid video link. Example: !mx d https://link.com", threadID, messageID);
    }

    // cache ফোল্ডার চেক এবং তৈরি
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true });
    }

    api.sendMessage(isDownload ? "📥 Downloading video, please wait..." : "🔍 Processing ad-free video link, please wait...", threadID, messageID);

    // মাল্টিপল API এন্ডপয়েন্ট যাতে একটি ফেইল করলে অন্যটি কাজ করে
    const apiEndpoints = [
      "https://api.cobalt.tools/api/json",
      "https://cobalt.canbeuseful.com/api/json",
      "https://api.cobalt.red/api/json"
    ];

    let success = false;
    let videoUrl = "";

    for (let endpoint of apiEndpoints) {
      try {
        const response = await axios.post(endpoint, {
          url: url,
          videoQuality: "720",
          isNoEndCards: true,
          downloadMode: isDownload,
          filenamePattern: "basic"
        }, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          timeout: 10000 // ১০ সেকেন্ড টাইমআউট
        });

        if (response.data && response.data.url) {
          videoUrl = response.data.url;
          success = true;
          break; // সফল হলে লুপ বন্ধ হবে
        }
      } catch (e) {
        console.log(`Failed with ${endpoint}, trying next...`);
        continue;
      }
    }

    if (!success) {
      return api.sendMessage("❌ All API servers are busy or the link is not supported. Please try again later.", threadID, messageID);
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
          api.sendMessage(`🎬 **MX Player Playback**\n\n⚠️ Video size: ${fileSizeInMB.toFixed(2)} MB (Too large for direct send).\n\n🔗 Ad-Free Link: ${videoUrl}\n\n💡 Tip: Open this link in MX Player for an ad-free experience.`, threadID, messageID);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } else {
          const msg = {
            body: isDownload ? `✅ Download Complete!` : `🎬 **MX Player Mode**\n✅ Ad-free playback ready.`,
            attachment: fs.createReadStream(filePath)
          };
          await api.sendMessage(msg, threadID, messageID);

          // ২ ঘণ্টা পর ক্যাশে থেকে ডিলিট করা
          setTimeout(() => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }, 2 * 60 * 60 * 1000);
        }
      });

      writer.on('error', (err) => {
        throw err;
      });

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Error while processing the video stream. Please try again.", threadID, messageID);
    }
  }
};
