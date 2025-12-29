const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "addtoc",
    version: "1.1.0",
    role: 2,
    author: "AkHi",
    description: "Save files to cache and view the list of cached files.",
    category: "system",
    countDown: 5,
    guide: {
      en: "Reply with {p}addtoc [name] OR use {p}addtoc list",
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, type } = event;
    const cacheDir = path.join(__dirname, "cache");

    // 1. Create folder automatically if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // 2. Logic to view the list of files
    if (args[0] === "list") {
      try {
        const files = fs.readdirSync(cacheDir);
        if (files.length === 0) return api.sendMessage("📂 The cache folder is currently empty.", threadID, messageID);

        let msg = "📂 List of files in cache:\n━━━━━━━━━━━━━━━\n";
        files.forEach((file, index) => {
          msg += `${index + 1}. ${file}\n`;
        });
        msg += "\n━━━━━━━━━━━━━━━";
        return api.sendMessage(msg, threadID, messageID);
      } catch (err) {
        return api.sendMessage("❌ Failed to load the file list.", threadID, messageID);
      }
    }

    // 3. Logic to upload/save files
    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("❌ Please reply to a photo or video, or use '!addtoc list'.", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];
    const attachmentType = attachment.type;

    const nameInput = args.join("_") || `file_${Date.now()}`;
    const extension = attachmentType === "video" ? ".mp4" : (attachmentType === "photo" ? ".jpg" : (attachmentType === "audio" ? ".mp3" : ".bin"));
    const fileName = nameInput.endsWith(extension) ? nameInput : nameInput + extension;
    const cachePath = path.join(cacheDir, fileName);

    try {
      api.sendMessage("⏳ Saving the file to the cache folder, please wait...", threadID, messageID);

      const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
      fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

      return api.sendMessage(
        `✅ Successfully Saved!\n\n📂 File Name: ${fileName}\n📍 Path: script/cmd/cache/${fileName}\n🎞️ Type: ${attachmentType}`,
        threadID,
        messageID
      );
    } catch (error) {
      console.error(error);
      return api.sendMessage("⚠️ An error occurred while saving the file.", threadID, messageID);
    }
  }
};
