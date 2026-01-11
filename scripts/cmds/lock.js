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
    version: "3.0.0",
    role: 1,
    author: "AkHi",
    description: "Anti-Change Group Info with Auto Restore (MongoDB)",
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
        // কভার ফটো ডাউনলোড করে সেভ করা হচ্ছে
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

        return message.reply("🔒 | Group info lock ON successfully ✅. Information synced to Database.");
      } catch (err) {
        return message.reply("❌ Error while locking: " + err.message);
      }
    }

    if (action === "off") {
      await LockModel.findOneAndUpdate({ threadID }, { status: false });
      return message.reply("🔓 | Group info lock OFF successfully ✅");
    }

    return message.reply("Use: lock on/off");
  },

  onEvent: async function ({ api, event }) {
    const { threadID, logMessageType, author } = event;
    const botID = api.getCurrentUserID();

    if (author === botID || !threadID) return;

    // ডাটাবেজ থেকে চেক করা
    const groupData = await LockModel.findOne({ threadID, status: true });
    if (!groupData) return;

    const warnMsg = "Access Restrictions ⚠️.\nThe Group information is locked so you can't change any information ❌.";

    try {
      // নাম পরিবর্তন করলে রিসেট
      if (logMessageType === "log:thread-name") {
        api.sendMessage(warnMsg, threadID);
        return api.setTitle(groupData.name, threadID);
      }

      // ইমোজি পরিবর্তন করলে রিসেট
      if (logMessageType === "log:thread-icon") {
        api.sendMessage(warnMsg, threadID);
        return api.setChatEmoji(groupData.emoji, threadID);
      }

      // কভার ফটো পরিবর্তন করলে রিসেট (এটা কাজ করবে যদি bot admin থাকে)
      if (logMessageType === "log:thread-image") {
        if (fs.existsSync(groupData.imagePath)) {
          api.sendMessage(warnMsg, threadID);
          return api.changeGroupImage(fs.createReadStream(groupData.imagePath), threadID);
        }
      }

      // কালার বা থিম পরিবর্তন হলে রিসেট
      if (logMessageType === "log:thread-color" || logMessageType === "log:thread-style") {
        api.sendMessage(warnMsg, threadID);
        // কালার সেট করার জন্য database এর color code ব্যবহার হবে
        return api.changeThreadColor(groupData.color, threadID);
      }

    } catch (e) {
      console.log("Error in Restore Process:", e);
    }
  }
};
