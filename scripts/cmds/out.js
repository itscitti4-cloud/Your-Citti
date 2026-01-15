const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "out",
    aliases: ["leave", "bye"],
    version: "1.2",
    author: "AkHi",
    countDown: 5,
    role: 2,
    shortDescription: "Make the bot leave the group",
    longDescription: "This command lets the bot leave a specific group or the current one.",
    category: "admin",
    guide: {
      en: "{pn} [tid (optional)] — Make the bot leave the group.\nExample:\n{pn} → leave current group\n{pn} 123456789 → leave group by ID"
    }
  },

  onStart: async function ({ api, event, args }) {
    let threadID;
    const senderID = event.senderID; // ডিফাইন করা হলো যাতে মেসেজে আইডিটি আসে

    if (!args[0]) {
      threadID = event.threadID;
    } else {
      threadID = args[0]; // parseInt এর বদলে সরাসরি স্ট্রিং নেওয়া নিরাপদ কারণ ID বড় হয়
      if (isNaN(threadID)) {
        return api.sendMessage("⚠️ | Invalid thread ID provided.", event.threadID);
      }
    }

    // Send styled leaving message
    const leaveMsg = `
👋 **Goodbye everyone!**
🤖 I’m leaving this group as order of ${senderID}.
🫶 Thanks for having me — take care and stay awesome!
`;

    api.sendMessage(leaveMsg, threadID, (err) => {
      if (err) return api.sendMessage("❌ | Could not send message, but attempting to leave...", event.threadID);
      api.removeUserFromGroup(api.getCurrentUserID(), threadID);
    });
  }
};
