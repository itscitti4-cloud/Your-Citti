const fs = require('fs-extra');
const path = require('path');

const cachePath = path.join(__dirname, 'cache', 'mutedUsers.json');

module.exports = {
  config: {
    name: "mute",
    aliases: ["unmute"],
    version: "2.7.0",
    author: "AkHi",
    countDown: 2,
    role: 1, 
    description: "Strictly mute members and auto-delete messages in real-time.",
    category: "admin",
    guide: "{p}mute [reply/@mention/uid] | {p}unmute | {p}mute all"
  },

  onLoad: function () {
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
      fs.mkdirSync(path.join(__dirname, 'cache'), { recursive: true });
    }
    if (!fs.existsSync(cachePath)) {
      fs.writeJsonSync(cachePath, {});
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions, body } = event;
    let mutedData = fs.readJsonSync(cachePath);

    let targetID;
    if (event.type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args.length > 0 && /^\d{10,16}$/.test(args[args.length - 1])) {
      targetID = args[args.length - 1];
    } else {
      return api.sendMessage("❌ | Please reply to a message or mention a user.", threadID, messageID);
    }

    if (targetID == api.getCurrentUserID()) return api.sendMessage("❌ | I cannot mute myself.", threadID);

    const isUnmute = body.toLowerCase().startsWith("!unmute") || args[0] === "unmute";

    if (isUnmute) {
      if (!mutedData[threadID] || !mutedData[threadID].includes(targetID)) {
        return api.sendMessage("⚠️ | User is not muted.", threadID);
      }
      mutedData[threadID] = mutedData[threadID].filter(id => id !== targetID);
      fs.writeJsonSync(cachePath, mutedData);
      return api.sendMessage("✅ | User has been unmuted successfully.", threadID);
    }

    if (!mutedData[threadID]) mutedData[threadID] = [];
    if (mutedData[threadID].includes(targetID)) {
      return api.sendMessage("⚠️ | This user is already muted.", threadID);
    }

    mutedData[threadID].push(targetID);
    fs.writeJsonSync(cachePath, mutedData);

    return api.sendMessage(`🔇 | User has been muted successfully. Messages will be auto-deleted.`, threadID);
  },

  // Goatbot v2 তে onChat সাধারণত ইভেন্ট লিসেনার হিসেবে কাজ করে
  onChat: async function ({ api, event }) {
    const { threadID, senderID, messageID } = event;
    
    if (!fs.existsSync(cachePath)) return;
    const mutedData = fs.readJsonSync(cachePath);

    // চেক করা হচ্ছে ইউজার মিউট লিস্টে আছে কি না
    if (mutedData[threadID] && mutedData[threadID].includes(senderID)) {
      try {
        // আপনার API এর unsendMessage ফাংশন ব্যবহার করে ডিলিট করা
        await api.unsendMessage(messageID);
      } catch (err) {
        // কনসোলে এরর দেখালে বোঝা যাবে পারমিশন সমস্যা কি না
        console.error("Auto-delete failed:", err);
      }
    }
  }
};
