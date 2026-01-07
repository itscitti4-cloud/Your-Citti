const fs = require('fs');
const path = require('path');

const cachePath = path.join(__dirname, 'cache', 'mutedUsers.json');

// cache ফোল্ডার এবং ফাইল নিশ্চিত করা
if (!fs.existsSync(path.join(__dirname, 'cache'))) {
  fs.mkdirSync(path.join(__dirname, 'cache'), { recursive: true });
}
if (!fs.existsSync(cachePath)) {
  fs.writeFileSync(cachePath, JSON.stringify({}));
}

module.exports = {
  config: {
    name: "mute",
    aliases: ["unmute"],
    version: "2.2.0",
    author: "AkHi",
    countDown: 2,
    role: 1, 
    description: "Mute members and auto-delete messages (Real-time).",
    category: "admin",
    guide: {
      en: "{p}mute [reply/@mention/uid] | {p}unmute | {p}mute all"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions, body } = event;
    let mutedData = JSON.parse(fs.readFileSync(cachePath));

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
      fs.writeFileSync(cachePath, JSON.stringify(mutedData, null, 2));
      return api.sendMessage("✅ | User has been unmuted.", threadID);
    }

    if (!mutedData[threadID]) mutedData[threadID] = [];
    if (mutedData[threadID].includes(targetID)) {
      return api.sendMessage("⚠️ | This user is already muted.", threadID);
    }

    mutedData[threadID].push(targetID);
    fs.writeFileSync(cachePath, JSON.stringify(mutedData, null, 2));

    if (args[0] === "all") {
      api.sendMessage(`🚫 | Muting user and clearing track...`, threadID);
      // এখানে 'mute all' মানে ওই ইউজারের আসা মাত্রই ডিলিট হওয়া নিশ্চিত করা হয়েছে।
      return;
    }

    return api.sendMessage(`🔇 | User has been muted successfully.`, threadID);
  },

  // এই অংশটি মেসেজ ডিলিট হওয়া নিশ্চিত করবে
  onChat: async function ({ api, event }) {
    const { threadID, senderID, messageID } = event;
    if (!fs.existsSync(cachePath)) return;
    const mutedData = JSON.parse(fs.readFileSync(cachePath));

    if (mutedData[threadID] && mutedData[threadID].includes(senderID)) {
      // মেসেজ আসার সাথে সাথে ডিলিট করার চেষ্টা
      return api.unsendMessage(messageID).catch(err => {
        console.error("Failed to unsend: " + err.message);
      });
    }
  }
};
  
