const mongoose = require("mongoose");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// MongoDB Connection String
const MONGO_URI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

// Database Schema
const lockSchema = new mongoose.Schema({
  threadID: { type: String, unique: true },
  name: String,
  emoji: String,
  color: String,
  imagePath: String,
  status: { type: Boolean, default: false }
});

const LockModel = mongoose.models.GroupLock || mongoose.model("GroupLock", lockSchema);

module.exports = {
  config: {
    name: "lock",
    version: "2.0.0",
    role: 1,
    author: "AkHi",
    description: "Group name, theme, Emoji and cover lock using MongoDB",
    category: "admin",
    guide: "{pn} on/off",
    countDown: 5
  },

  onLoad: async function () {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    const coverDir = path.join(__dirname, "cache", "groupCovers");
    if (!fs.existsSync(coverDir)) fs.ensureDirSync(coverDir);
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    const action = args[0]?.toLowerCase();

    if (action === "on") {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const botID = api.getCurrentUserID();

        if (!threadInfo.adminIDs.some(admin => admin.id === botID)) {
          return message.reply("⚠️ | I need admin privileges to lock group information.");
        }

        // Save Image to local folder for persistent backup
        const imgPath = path.join(__dirname, "cache", "groupCovers", `${threadID}.jpg`);
        if (threadInfo.imageSrc) {
          const response = await axios.get(threadInfo.imageSrc, { responseType: 'arraybuffer' });
          fs.writeFileSync(imgPath, Buffer.from(response.data));
        }

        await LockModel.findOneAndUpdate(
          { threadID },
          {
            name: threadInfo.threadName,
            emoji: threadInfo.emoji,
            color: threadInfo.color,
            imagePath: imgPath,
            status: true
          },
          { upsert: true }
        );

        return message.reply("🔒 | Group info lock ON successfully ✅. Information has been synced to Database.");
      } catch (err) {
        return message.reply("❌ Error: " + err.message);
      }
    }

    if (action === "off") {
      await LockModel.findOneAndUpdate({ threadID }, { status: false });
      return message.reply("🔓 | Group info lock OFF successfully ✅");
    }

    return message.reply("Use: lock on/off");
  },

  onEvent: async function ({ api, event, message }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    const botID = api.getCurrentUserID();

    if (author === botID) return;

    const groupData = await LockModel.findOne({ threadID, status: true });
    if (!groupData) return;

    const warnMsg = "Access Restrictions ⚠️.\nThe Group information is locked so you can't change any information ❌.";

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      if (!threadInfo.adminIDs.some(admin => admin.id === botID)) return;

      switch (logMessageType) {
        case "log:thread-name":
          if (logMessageData.name !== groupData.name) {
            await message.reply(warnMsg);
            api.setTitle(groupData.name, threadID);
          }
          break;

        case "log:thread-icon":
          if (logMessageData.thread_icon !== groupData.emoji) {
            await message.reply(warnMsg);
            api.setChatEmoji(groupData.emoji, threadID);
          }
          break;

        case "log:thread-color":
        case "log:thread-style":
          if (logMessageData.thread_color !== groupData.color) {
            await message.reply(warnMsg);
            api.changeThreadColor(groupData.color, threadID);
          }
          break;

        case "log:thread-image":
          if (fs.existsSync(groupData.imagePath)) {
            await message.reply(warnMsg);
            api.changeGroupImage(fs.createReadStream(groupData.imagePath), threadID);
          }
          break;
      }
    } catch (e) {
      console.error("Lock Error:", e);
    }
  }
};
              
