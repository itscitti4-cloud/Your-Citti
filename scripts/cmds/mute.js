const fs = require('fs');
const path = require('path');

const cachePath = path.join(__dirname, 'cache', 'mutedUsers.json');

// cache ফোল্ডার এবং ফাইল চেক ও তৈরি করা
if (!fs.existsSync(path.join(__dirname, 'cache'))) {
  fs.mkdirSync(path.join(__dirname, 'cache'), { recursive: true });
}
if (!fs.existsSync(cachePath)) {
  fs.writeFileSync(cachePath, JSON.stringify({}));
}

module.exports = {
  config: {
    name: "mute",
    aliases: ["unmute"], // একই ফাইলে আনমিউট কাজ করবে
    version: "2.1.0",
    author: "AkHi",
    countDown: 2,
    role: 1, 
    description: "Mute/Unmute members with auto-delete and persistent storage.",
    category: "admin",
    guide: {
      en: "{p}mute [reply/@mention/uid] | {p}unmute [reply/@mention/uid] | {p}mute all [reply/@mention/uid]"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, mentions, body } = event;
    let mutedData = JSON.parse(fs.readFileSync(cachePath));

    // ১. টার্গেট আইডি নির্ধারণ
    let targetID;
    if (event.type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args.length > 0 && /^\d{10,16}$/.test(args[args.length - 1])) {
      targetID = args[args.length - 1];
    } else {
      return api.sendMessage("❌ | Please reply, mention, or give a UID.", threadID, messageID);
    }

    if (targetID == api.getCurrentUserID()) return api.sendMessage("❌ | I can't mute myself!", threadID);

    const isUnmute = body.toLowerCase().startsWith("!unmute") || args[0] === "unmute";

    // --- Unmute Logic ---
    if (isUnmute) {
      if (!mutedData[threadID] || !mutedData[threadID].includes(targetID)) {
        return api.sendMessage("⚠️ | This user is not muted in this group.", threadID);
      }
      mutedData[threadID] = mutedData[threadID].filter(id => id !== targetID);
      fs.writeFileSync(cachePath, JSON.stringify(mutedData, null, 2));
      return api.sendMessage("✅ | User has been unmuted.", threadID);
    }

    // --- Mute Logic ---
    if (!mutedData[threadID]) mutedData[threadID] = [];
    
    if (mutedData[threadID].includes(targetID)) {
      return api.sendMessage("⚠️ | This user is already muted.", threadID);
    }

    mutedData[threadID].push(targetID);
    fs.writeFileSync(cachePath, JSON.stringify(mutedData, null, 2));

    if (args[0] === "all") {
       return api.sendMessage(`🚫 | User (UID: ${targetID}) is now muted. All their new messages will be auto-deleted.`, threadID);
    }

    return api.sendMessage(`🔇 | User has been muted successfully.`, threadID);
  },

  // মেসেজ ডিলিট করার জন্য মেইন লজিক
  onChat: async function ({ api, event }) {
    const { threadID, senderID, messageID } = event;
    
    // ফাইল থেকে লেটেস্ট মিউট লিস্ট পড়া
    if (!fs.existsSync(cachePath)) return;
    const mutedData = JSON.parse(fs.readFileSync(cachePath));

    if (mutedData[threadID] && mutedData[threadID].includes(senderID)) {
      try {
        await api.unsendMessage(messageID);
      } catch (err) {
        console.error("Mute system couldn't delete message: " + err.message);
      }
    }
  }
};
