const fs = require('fs-extra');
const path = require('path');

const cachePath = path.join(__dirname, 'cache', 'mutedUsers.json');

module.exports = {
  config: {
    name: "mute",
    aliases: ["unmute"],
    version: "2.5.0",
    author: "AkHi",
    countDown: 2,
    role: 1, 
    description: "Strictly mute members with real-time deletion.",
    category: "admin",
    guide: {
      en: "{p}mute [reply/@mention/uid] | {p}unmute | {p}mute all"
    }
  },

  // ফাইলটি লোড হওয়ার সময় ক্যাশ নিশ্চিত করা
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
      return api.sendMessage("✅ | User has been unmuted.", threadID);
    }

    if (!mutedData[threadID]) mutedData[threadID] = [];
    if (mutedData[threadID].includes(targetID)) {
      return api.sendMessage("⚠️ | This user is already muted.", threadID);
    }

    mutedData[threadID].push(targetID);
    fs.writeJsonSync(cachePath, mutedData);

    if (args[0] === "all") {
      return api.sendMessage(`🚫 | User muted with 'Strict Mode'. All future messages will be deleted instantly.`, threadID);
    }

    return api.sendMessage(`🔇 | User has been muted successfully.`, threadID);
  },

  // ইভেন্ট লিসেনার যা প্রতিটি মেসেজ চেক করবে
  handleEvent: async function ({ api, event }) {
    const { threadID, senderID, messageID, type } = event;
    
    // শুধু মেসেজ এবং ইমোজি টাইপ চেক করা
    if (type !== "message" && type !== "message_reply") return;

    if (!fs.existsSync(cachePath)) return;
    const mutedData = fs.readJsonSync(cachePath);

    if (mutedData[threadID] && mutedData[threadID].includes(senderID)) {
      try {
        // ডিলিট করার আগে ৩৫০ মিলি-সেকেন্ড বিরতি (বট ডিটেকশন এড়াতে)
        setTimeout(() => {
          api.unsendMessage(messageID);
        }, 350);
      } catch (err) {
        console.error("Mute Error: " + err.message);
      }
    }
  }
};
        
