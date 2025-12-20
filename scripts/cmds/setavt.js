const axios = require("axios");

module.exports = {
  config: {
    name: "setpp",
    version: "1.0.0",
    hasPermssion: 2, // শুধুমাত্র অ্যাডমিনদের জন্য (প্রোফাইল সিকিউরিটির কারণে)
    credits: "AkHi",
    description: "Set Facebook profile",
    commandCategory: "Social",
    usages: "[<!setpp> Reply to an image]",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    // প্রয়োজন হলে এখানে ইভেন্ট হ্যান্ডেলিং করা যায়
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, senderID } = event;

    // ১. চেক করা হচ্ছে রিপ্লাই দেওয়া হয়েছে কি না এবং সেটি ইমেজ কি না
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("দয়া করে একটি ছবির রিপ্লাইতে কমান্ডটি লিখুন।", threadID, messageID);
    }

    try {
      const imageUrl = messageReply.attachments[0].url;

      // ২. ফেসবুক এপিআই এর মাধ্যমে প্রোফাইল পিকচার পরিবর্তন
      // দ্রষ্টব্য: এটি শুধুমাত্র কাজ করবে যদি আপনার সেশন (Cookie) এ যথাযথ পারমিশন থাকে
      await api.changeAvatar(imageUrl, "", 0); 

      // ৩. সফল হওয়ার মেসেজ
      return api.sendMessage("AkHi Ma'am, Change bot Profile successfully ✅", threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("AkHi Ma'am, I'm so sorry, set profile failed 🥺", threadID, messageID);
    }
  }
};
