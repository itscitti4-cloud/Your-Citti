const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

const storagePath = path.join(__dirname, "album_storage");

module.exports = {
  config: {
    name: "album",
    version: "2.0.0",
    role: 0,
    author: "AkHi",
    description: "Save and view local album videos/photos.",
    category: "Media",
    countDown: 5,
    guide: {
      en: "{p}{n} add [category] (reply to media) or {p}{n} to see list",
    },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, type } = event;

    // নিশ্চিত করা যে স্টোরেজ ফোল্ডার আছে
    if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath);

    // ১. অ্যালবাম অ্যাড করার লজিক: !album add <category>
    if (args[0] === "add") {
      const category = args[1]?.toLowerCase();
      if (!category) return api.sendMessage("⚠️ | Please provide a category name. Example: !album add funny", threadID, messageID);
      
      if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
        return api.sendMessage("⚠️ | Please reply to a video or photo to add it to the album.", threadID, messageID);
      }

      const attachment = messageReply.attachments[0];
      const categoryDir = path.join(storagePath, category);
      if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir);

      const extension = attachment.type === "video" ? ".mp4" : attachment.type === "photo" ? ".jpg" : ".gif";
      const fileName = `item_${Date.now()}${extension}`;
      const filePath = path.join(categoryDir, fileName);

      try {
        const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(response.data));
        return api.sendMessage(`✅ | Added to [${category}] successfully!`, threadID, messageID);
      } catch (e) {
        return api.sendMessage("❌ | Failed to save media.", threadID, messageID);
      }
    }

    // ২. অ্যালবামের লিস্ট দেখানোর লজিক
    const categories = fs.readdirSync(storagePath).filter(file => fs.statSync(path.join(storagePath, file)).isDirectory());
    
    if (categories.length === 0) {
      return api.sendMessage("📂 | The album is empty. Use !album add [category] to start saving!", threadID, messageID);
    }

    let msg = "╔══════════════════════╗\n" +
              "   ❤️‍🔥 𝗔𝗟𝗕𝗨𝗠 𝗠𝗘𝗡𝗨 𝗕𝗔𝗕𝗬 ❤️‍🔥\n" +
              "╚══════════════════════╝\n";
    
    categories.forEach((cat, index) => {
      msg += `┌ ${index + 1}. ${cat.toUpperCase()}\n`;
    });
    
    msg += "━━━━━━━━━━━━━━━━━━━━━━━━\n📍 Reply with a number to get media.";

    return api.sendMessage(msg, threadID, (error, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        type: "reply",
        messageID: info.messageID,
        author: senderID,
        categories: categories
      });
    }, messageID);
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, body } = event;
    const { categories } = Reply;
    api.unsendMessage(Reply.messageID);

    const index = parseInt(body) - 1;
    if (isNaN(index) || !categories[index]) {
      return api.sendMessage("⚠️ | Invalid selection. Please reply with a valid number.", threadID, messageID);
    }

    const selectedCategory = categories[index];
    const categoryDir = path.join(storagePath, selectedCategory);
    const files = fs.readdirSync(categoryDir);

    if (files.length === 0) {
      return api.sendMessage(`❌ | No files found in [${selectedCategory}] category.`, threadID, messageID);
    }

    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(categoryDir, randomFile);

    return api.sendMessage({
      body: `✅ | Here is your ${selectedCategory} media!`,
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);
  }
};
