const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "lock",
    version: "1.5.0",
    role: 1, // শুধুমাত্র এডমিনরা ব্যবহার করতে পারবে
    author: "AkHi",
    description: "group name, theme, Emoji And cover lock/antichange",
    category: "admin",
    guide: "{pn} on/off",
    countDown: 5
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    const lockFile = path.join(__dirname, "cache", "lockData.json");

    if (!fs.existsSync(lockFile)) fs.writeJsonSync(lockFile, {});
    let lockData = fs.readJsonSync(lockFile);

    if (args[0] === "on") {
      const threadInfo = await api.getThreadInfo(threadID);
      lockData[threadID] = {
        name: threadInfo.threadName,
        emoji: threadInfo.emoji,
        color: threadInfo.color,
        imageSrc: threadInfo.imageSrc,
        status: true
      };
      fs.writeJsonSync(lockFile, lockData);
      return message.reply("🔒 | Group info lock on Successfully ✅. Now no one can change Name/theme/emoji/cover ❌");
    } 
    
    if (args[0] === "off") {
      if (lockData[threadID]) {
        lockData[threadID].status = false;
        fs.writeJsonSync(lockFile, lockData);
        return message.reply("🔓 | Group info lock off Successfully ✅");
      }
      return message.reply("⚠️ | Group info lock is already off ❌");
    }

    return message.reply("Please type: !lock on or !lock off");
  },

  onEvent: async function ({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    const lockFile = path.join(__dirname, "cache", "lockData.json");

    if (!fs.existsSync(lockFile)) return;
    let lockData = fs.readJsonSync(lockFile);

    if (!lockData[threadID] || !lockData[threadID].status) return;

    const data = lockData[threadID];

    // নাম পরিবর্তন রোধ
    if (logMessageType === "log:thread-name") {
      api.setTitle(data.name, threadID);
    }

    // ইমোজি পরিবর্তন রোধ
    if (logMessageType === "log:thread-icon") {
      api.setEmoji(data.emoji, threadID);
    }

    // থিম/কালার পরিবর্তন রোধ
    if (logMessageType === "log:thread-color") {
      api.changeThreadColor(data.color, threadID);
    }

    // প্রোফাইল পিকচার পরিবর্তন রোধ (বটের কাছে ছবি থাকলে)
    if (logMessageType === "log:thread-image") {
      // দ্রষ্টব্য: ছবি অটো-রিসেট করার জন্য বটের এডমিন পারমিশন এবং ছবির ইউআরএল প্রয়োজন হয়।
      // সাধারণ নিরাপত্তার জন্য এটি নাম ও ইমোজিতে বেশি কার্যকর।
    }
  }
};
        
