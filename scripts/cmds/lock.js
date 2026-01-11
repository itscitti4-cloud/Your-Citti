const mongoose = require("mongoose");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const MONGO_URI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

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
    version: "2.1.0",
    role: 1,
    author: "AkHi",
    description: "Group info and cover lock with auto-restore",
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

        return message.reply("🔒 | Group info lock ON successfully ✅.");
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

  onEvent: async function ({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    const botID = api.getCurrentUserID();

    if (author === botID || !threadID) return;

    const groupData = await LockModel.findOne({ threadID, status: true });
    if (!groupData) return;

    const warnMsg = "Access Restrictions ⚠️.\nThe Group information is locked so you can't change any information ❌.";

    const restore = async () => {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        if (!threadInfo.adminIDs.some(admin => admin.id === botID)) return;

        // নাম পরিবর্তন হলে রিসেট
        if (logMessageType === "log:thread-name") {
            await api.sendMessage(warnMsg, threadID);
            return api.setTitle(groupData.name, threadID);
        }

        // ইমোজি পরিবর্তন হলে রিসেট
        if (logMessageType === "log:thread-icon") {
            await api.sendMessage(warnMsg, threadID);
            return api.setChatEmoji(groupData.emoji, threadID);
        }

        // থিম/কালার পরিবর্তন হলে রিসেট
        if (logMessageType === "log:thread-color" || logMessageType === "log:thread-style") {
            await api.sendMessage(warnMsg, threadID);
            return api.changeThreadColor(groupData.color, threadID);
        }

        // কভার ফটো পরিবর্তন হলে রিসেট
        if (logMessageType === "log:thread-image") {
            if (fs.existsSync(groupData.imagePath)) {
                await api.sendMessage(warnMsg, threadID);
                return api.changeGroupImage(fs.createReadStream(groupData.imagePath), threadID);
            }
        }
      } catch (e) {
        console.error("Restore Error:", e);
      }
    };

    // চেক করা হচ্ছে ইভেন্টটি আমাদের লকের সাথে মিলে কি না
    const lockEvents = ["log:thread-name", "log:thread-icon", "log:thread-color", "log:thread-style", "log:thread-image"];
    if (lockEvents.includes(logMessageType)) {
      await restore();
    }
  }
};
