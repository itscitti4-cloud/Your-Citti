const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "album",
    version: "1.7.5",
    role: 0,
    author: "AkHi", // ⚠️ এটি পরিবর্তন করলে কমান্ড কাজ করবে না
    countDown: 5,
    category: "media",
    guide: {
      en: "{p}{n} [cartoon/sad/islamic/funny/anime/...]",
    },
  },

  onStart: async function ({ api, event, args }) {
    // --- Author Lock System ---
    const requiredAuthor = "AkHi"; 
    if (this.config.author !== requiredAuthor) {
      return api.sendMessage(
        `❌ [ AUTHOR LOCK ] ❌\n--------------------------\nWarning: You have changed the author name! Please set it back to "${requiredAuthor}" to use this command.`,
        event.threadID,
        event.messageID
      );
    }
    // ---------------------------

    if (!args[0]) {
      api.setMessageReaction("😽", event.messageID, (err) => {}, true);

      const albumOptions = [
        "𝐅𝐮𝐧𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 📔", "𝐈𝐬𝐥𝐚𝐦𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 📔", "𝐒𝐚𝐝 𝐕𝐢𝐝𝐞𝐨 📔", "𝐀𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 📔",
        "𝐂𝐚𝐫𝐭𝐨𝐨𝐧 𝐕𝐢𝐝𝐞𝐨 📔", "𝐋𝐨𝐅𝐢 𝐕𝐢𝐝𝐞𝐨 📔", "𝐂𝐨𝐮𝐩𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 📔", "𝐅𝐥𝐨𝐰𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 📔",
        "𝐀𝐞𝐬𝐭𝐡𝐞𝐭𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 📔", "𝐒𝐢𝐠𝐦𝐚 𝐑𝐮𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 📔", "𝐋𝐲𝐫𝐢𝐜𝐬 𝐕𝐢𝐝𝐞𝐨 📔", "𝐂𝐚𝐭 𝐕𝐢𝐝𝐞𝐨 📔",
        "𝐅𝐫𝐞𝐞 𝐅𝐢𝐫𝐞 𝐕𝐢𝐝𝐞𝐨 📔", "𝐅𝐨𝐨𝐭𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 📔", "𝐆𝐢𝐫𝐥 𝐕𝐢𝐝𝐞𝐨 📔", "𝐅𝐫𝐢𝐞𝐧𝐝𝐬 𝐕𝐢𝐝𝐞𝐨 📔",
      ];

      const message =
        "𝐇𝐞𝐫𝐞 𝐢𝐬 𝐲𝐨𝐮𝐫 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐚𝐥𝐛𝐮𝐦 𝐯𝐢𝐝𝐞𝐨 𝐥𝐢𝐬𝐭 📔\n" +
        "━━━━━━━━━━━━━━━━━━━━━\n" +
        albumOptions.map((option, index) => `${index + 1}. ${option}`).join("\n") +
        "\n━━━━━━━━━━━━━━━━━━━━━";

      await api.sendMessage(
        message,
        event.threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            link: albumOptions,
          });
        },
        event.messageID
      );
    }
  },

  onReply: async function ({ api, event, Reply }) {
    // রিপ্লাই আসলে চেক করবে অথর ঠিক আছে কি না (Double Security)
    if (this.config.author !== "AkHi") return;

    api.unsendMessage(Reply.messageID);

    const categories = [
      "funny", "islamic", "sad", "anime", "cartoon", "lofi", 
      "couple", "flower", "aesthetic", "sigma", "lyrics", 
      "cat", "freefire", "football", "girl", "friends"
    ];

    const captions = [
      "❰ 𝐅𝐮𝐧𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 <😹 ❱", "❰ 𝐈𝐬𝐥𝐚𝐦𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 <🕋 ❱", "❰ 𝐒𝐚𝐝 𝐕𝐢𝐝𝐞𝐨 <😿 ❱",
      "❰ 𝐀𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 <🥱 ❱", "❰ 𝐂𝐚𝐫𝐭𝐨𝐨𝐧 𝐕𝐢𝐝𝐞𝐨 <❤️‍🩹 ❱", "❰ 𝐋𝐨𝐅𝐢 𝐕𝐢𝐝𝐞𝐨 <🌆 ❱",
      "❰ 𝐂𝐨𝐮𝐩𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 <💑 ❱", "❰ 𝐅𝐥𝐨𝐰𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 <🌸 ❱", "❰ 𝐀𝐞𝐬𝐭𝐡𝐞𝐭𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 <🎨 ❱",
      "❰ 𝐒𝐢𝐠𝐦𝐚 𝐕𝐢𝐝𝐞𝐨 <🗿 ❱", "❰ 𝐋𝐲𝐫𝐢𝐜𝐬 𝐕𝐢𝐝𝐞𝐨 <🎵 ❱", "❰ 𝐂𝐚𝐭 𝐕𝐢𝐝𝐞𝐨 <🐱 ❱",
      "❰ 𝐅𝐫𝐞𝐞 𝐅𝐢𝐫𝐞 𝐕𝐢𝐝𝐞𝐨 <🔥 ❱", "❰ 𝐅𝐨𝐨𝐭𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 <⚽ ❱", "❰ 𝐆𝐢𝐫𝐥 𝐕𝐢𝐝𝐞𝐨 <💃 ❱",
      "❰ 𝐅𝐫𝐢𝐞𝐧𝐝𝐬 𝐕𝐢𝐝𝐞𝐨 <👫🏼 ❱"
    ];

    const replyIndex = parseInt(event.body);
    if (isNaN(replyIndex) || replyIndex < 1 || replyIndex > categories.length) {
      return api.sendMessage("⚠️ Please reply with a valid number from the list!", event.threadID);
    }

    let query = categories[replyIndex - 1];
    let cp = captions[replyIndex - 1];

    try {
      const response = await axios.get(`https://mahabub-video-api-we90.onrender.com/mahabub/${query}`);
      const videoUrl = response.data.data;

      if (!videoUrl) {
        return api.sendMessage("❌ No video found for this category!", event.threadID);
      }

      const filePath = path.join(__dirname, `album_${Date.now()}.mp4`);
      
      const res = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({ 
          body: cp, 
          attachment: fs.createReadStream(filePath) 
        }, event.threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, event.messageID);
      });

    } catch (error) {
      api.sendMessage("❌ Failed to fetch or download the video.", event.threadID);
    }
  },
};
    
