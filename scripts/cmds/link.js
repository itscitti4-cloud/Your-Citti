const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "link",
    aliases: ["mx", "player", "mxplayer"],
    version: "1.3.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    category: "utility",
    guide: "{pn} <link> (to direct ad free link) or {pn} d <link> (to download)",
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

    api.sendMessage(isDownload ? "📥 Downloading video, please wait..." : "🔍 Processing ad-free video link, please wait...", threadID, messageID);

    try {
      // Fetching clean, ad-free video source using Cobalt API
      const response = await axios.post(`https://api.cobalt.tools/api/json`, {
        url: url,
        videoQuality: "720", 
        isNoEndCards: true, // এটি ভিডিওর শেষে বিজ্ঞাপন বা এন্ড-কার্ড ব্লক করবে
        downloadMode: false, // স্ট্রিমিং এর জন্য ডাইরেক্ট সোর্স লিঙ্ক নিশ্চিত করবে
        filenamePattern: "basic" 
      }, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      const videoUrl = response.data.url;
      if (!videoUrl) throw new Error("Video link not found.");

      const fileName = `mx_video_${Date.now()}.mp4`;
      const cachePath = path.join(__dirname, "cache");
      const filePath = path.join(cachePath, fileName);

      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
      }

      // Taking video stream
      const videoStream = await axios.get(videoUrl, { responseType: 'stream' });
      const writer = fs.createWriteStream(filePath);
      videoStream.data.pipe(writer);

      writer.on('finish', async () => {
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        // Messenger Limit Check (Send link if > 25MB, else send file)
        if (fileSizeInMB > 25) {
          api.sendMessage(`🎬 **MX Player Ad-Free Play**\n\n⚠️ The video is too large (${fileSizeInMB.toFixed(2)} MB) to send directly.\n\n🔗 Clean Stream Link: ${videoUrl}\n\n💡 Tip: Use MX Player to open this link for the best experience.`, threadID, messageID);
          
          // Delete large file immediately as it's not being sent
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } else {
          const msg = {
            body: isDownload ? `✅ Video downloaded successfully!` : `🎬 **MX Player Mode Activated**\n✅ Ad-blocker applied. Enjoy the clean video.`,
            attachment: fs.createReadStream(filePath)
          };
          await api.sendMessage(msg, threadID, messageID);

          // Auto-delete file from server/cache after 2 hours
          setTimeout(() => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`[MX-CACHE] Auto-deleted: ${fileName}`);
            }
          }, 2 * 60 * 60 * 1000); 
        }
      });

      writer.on('error', (err) => {
        throw err;
      });

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Error! Could not process the ad-free link. Please check if the link is valid or try again.", threadID, messageID);
    }
  }
};
