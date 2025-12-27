const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "album",
    version: "2.0.0",
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

    // Sample API structure with categories
    const videoDataUrl = "https://raw.githubusercontent.com/Aks-Sarkar/Video-Api/main/video_v2.json";

    try {
      const res = await axios.get(videoDataUrl);
      const categories = Object.keys(res.data);

      let msg = "✨ [ Video Album Categories ] ✨\n--------------------------\n";
      categories.forEach((cat, index) => {
        msg += `${index + 1}. ${cat.toUpperCase()}\n`;
      });
      msg += "--------------------------\nReply with the category number to see the video list.";

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
      return api.sendMessage("Error: Could not load categories.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, body, senderID } = event;
    if (Reply.author !== senderID) return;

    const { allData, type, commandName } = Reply;
    const choice = parseInt(body);

    if (type === "category") {
      const categories = Object.keys(allData);
      if (isNaN(choice) || choice < 1 || choice > categories.length) {
        return api.sendMessage("Invalid choice. Please pick a correct number.", threadID, messageID);
      }

      const selectedCategory = categories[choice - 1];
      const videos = allData[selectedCategory];

      let msg = `🎥 [ ${selectedCategory.toUpperCase()} Video List ] 🎥\n--------------------------\n`;
      videos.forEach((vid, index) => {
        msg += `${index + 1}. Video ${index + 1}\n`;
      });
      msg += "--------------------------\nReply with the video number to watch.";

      api.unsendMessage(Reply.messageID);
      return api.sendMessage(msg, threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: commandName,
          messageID: info.messageID,
          author: senderID,
          videoList: videos,
          type: "video"
        });
      }, messageID);

    } else if (type === "video") {
      const { videoList } = Reply;
      if (isNaN(choice) || choice < 1 || choice > videoList.length) {
        return api.sendMessage("Invalid choice.", threadID, messageID);
      }

      const videoUrl = videoList[choice - 1];
      api.unsendMessage(Reply.messageID);
      api.sendMessage("⏳ Sending video, please wait...", threadID);

      const videoPath = path.join(__dirname, "cache", `album_${Date.now()}.mp4`);
      try {
        const response = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);

        writer.on('finish', () => {
          return api.sendMessage({
            body: "🎥 Enjoy your video!",
            attachment: fs.createReadStream(videoPath)
          }, threadID, () => fs.unlinkSync(videoPath), messageID);
        });
      } catch (e) {
        return api.sendMessage("Error downloading video.", threadID, messageID);
      }
    }
  }
};
                      
