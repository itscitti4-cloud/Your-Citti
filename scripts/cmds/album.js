const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "album",
    version: "2.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Category based video album",
    longDescription: "Select categories and get specific videos from the list.",
    category: "entertainment",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const videoDataUrl = "https://raw.githubusercontent.com/Aks-Sarkar/Video-Api/main/video_v2.json";

    try {
      const res = await axios.get(videoDataUrl);
      const categories = Object.keys(res.data);

      let msg = "✨ [ Video Album Categories ] ✨\n--------------------------\n";
      categories.forEach((cat, index) => {
        msg += `${index + 1}. ${cat.toUpperCase()}\n`;
      });
      msg += "--------------------------\nReply with category number.";

      return api.sendMessage(msg, threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          allData: res.data,
          type: "category"
        });
      }, messageID);
    } catch (e) {
      return api.sendMessage("❌ Could not load categories. API might be down.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, body, senderID } = event;
    if (Reply.author !== senderID) return;

    const { allData, type, commandName } = Reply;
    const choice = parseInt(body);

    if (type === "category") {
      const categories = Object.keys(allData);
      if (isNaN(choice) || choice < 1 || choice > categories.length) return;

      const selectedCategory = categories[choice - 1];
      const videos = allData[selectedCategory];

      let msg = `🎥 [ ${selectedCategory.toUpperCase()} ]\n--------------------------\n`;
      videos.forEach((vid, index) => { msg += `${index + 1}. Video ${index + 1}\n`; });
      msg += "--------------------------\nReply with video number.";

      api.unsendMessage(Reply.messageID);
      return api.sendMessage(msg, threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: commandName,
          author: senderID,
          videoList: videos,
          type: "video"
        });
      }, messageID);

    } else if (type === "video") {
      const { videoList } = Reply;
      if (isNaN(choice) || choice < 1 || choice > videoList.length) return;

      const videoUrl = videoList[choice - 1];
      api.unsendMessage(Reply.messageID);
      
      // cache ফোল্ডার চেক করা
      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

      const videoPath = path.join(cachePath, `album_${Date.now()}.mp4`);
      api.sendMessage("⏳ Sending video, please wait...", threadID);

      try {
        const response = await axios({
          url: videoUrl,
          method: 'GET',
          responseType: 'stream',
          headers: { 'User-Agent': 'Mozilla/5.0' } // অনেক সময় ইউজার এজেন্ট ছাড়া ডাউনলোড ব্লক হয়
        });

        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);

        writer.on('finish', () => {
          api.sendMessage({
            body: "🎥 Enjoy your video!",
            attachment: fs.createReadStream(videoPath)
          }, threadID, () => {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
          }, messageID);
        });

        writer.on('error', () => api.sendMessage("Error saving video file.", threadID));

      } catch (e) {
        console.error(e);
        return api.sendMessage("❌ Error: Video link is dead or server refused connection.", threadID, messageID);
      }
    }
  }
};
