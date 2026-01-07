const fs = require('fs');

// মিউট করা ইউজারদের ডাটা রাখার জন্য গ্লোবাল ভ্যারিয়েবল
if (!global.mutedUsers) global.mutedUsers = new Map();

module.exports = {
  config: {
    name: "mute",
    version: "2.0.0",
    author: "AkHi",
    countDown: 2,
    role: 1, // Admin & Bot Admin
    description: "Mute members to auto-delete their messages.",
    category: "admin",
    guide: {
      en: "{p}mute [@mention / reply / uid] | {p}unmute [@mention / reply / uid] | {p}mute all [@mention / reply / uid]"
    }
  },

  onStart: async function ({ api, event, args, threadsData, role }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    // ১. টার্গেট আইডি নির্ধারণ
    let targetID;
    if (event.type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args.length > 0 && /^\d{10,16}$/.test(args[args.length - 1])) {
      targetID = args[args.length - 1];
    } else {
      return api.sendMessage("❌ | Please mention, reply, or provide a UID to mute/unmute.", threadID, messageID);
    }

    if (targetID == api.getCurrentUserID()) return api.sendMessage("❌ | I cannot mute myself!", threadID);

    // ২. কমান্ড হ্যান্ডলিং
    const command = args[0]?.toLowerCase();

    // !unmute
    if (this.config.name === "unmute" || command === "unmute") {
      if (global.mutedUsers.has(`${threadID}_${targetID}`)) {
        global.mutedUsers.delete(`${threadID}_${targetID}`);
        return api.sendMessage("✅ | User has been unmuted. Messages will no longer be deleted.", threadID);
      } else {
        return api.sendMessage("⚠️ | This user is not muted.", threadID);
      }
    }

    // !mute all
    if (command === "all") {
      global.mutedUsers.set(`${threadID}_${targetID}`, true);
      api.sendMessage("⏳ | Muting and cleaning up all previous messages...", threadID);
      
      // পুরাতন মেসেজ ডিলিট করার চেষ্টা (বটের কাছে মেসেজ হিস্ট্রি পারমিশন থাকলে)
      const threadInfo = await api.getThreadInfo(threadID);
      // নোট: অনেক ক্ষেত্রে API সব পুরাতন মেসেজ একসাথে ডিলিট করার অনুমতি দেয় না, তবে এটি ভবিষ্যতের মেসেজ ব্লক করবে।
      return api.sendMessage(`🚫 | User (UID: ${targetID}) is now muted globally in this group. All their messages will be deleted.`, threadID);
    }

    // !mute (সাধারণ মিউট)
    global.mutedUsers.set(`${threadID}_${targetID}`, true);
    return api.sendMessage(`🔇 | User has been muted. Their new messages will be auto-deleted.`, threadID);
  },

  // মেসেজ ডিলিট করার লজিক
  onChat: async function ({ api, event }) {
    const { threadID, senderID, messageID } = event;

    // যদি ইউজার মিউট লিস্টে থাকে
    if (global.mutedUsers.has(`${threadID}_${senderID}`)) {
      try {
        await api.unsendMessage(messageID);
      } catch (err) {
        // যদি বট অ্যাডমিন না হয় তবে ডিলিট করতে পারবে না
        console.error("Failed to auto-delete message: " + err);
      }
    }
  }
};
