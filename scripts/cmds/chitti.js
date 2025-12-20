const axios = require("axios");

module.exports = {
  config: {
    name: "chitti",
    version: "1.0.5",
    hasPermssion: 0,
    credits: "AkHi",
    description: "বটের নাম ধরে ডাকলে বা রিপ্লাই করলে ChatGPT উত্তর দেবে",
    commandCategory: "ai",
    usages: "[বটের নাম] [আপনার প্রশ্ন]",
    cooldowns: 2,
  },

  // এই ফাংশনটি প্রতিটি মেসেজ চেক করবে
  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body, senderID, messageReply } = event;
    if (!body) return;

    const botName = "chitti"; // আপনার বটের নাম এখানে দিন
    const input = body.toLowerCase();

    // চেক: বটের নাম ধরে ডাকা হয়েছে কি না অথবা বটের মেসেজে রিপ্লাই দেওয়া হয়েছে কি না
    const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();
    const isCallingBot = input.startsWith(botName.toLowerCase());

    if (isCallingBot || isReplyToBot) {
      let query = body;

      if (isCallingBot) {
        query = body.slice(botName.length).trim();
      }

      if (!query && isCallingBot) {
        return api.sendMessage(`জি আমি শুনছি! কিছু জিজ্ঞেস করবেন?`, threadID, messageID);
      }

      // রিপ্লাইয়ের ক্ষেত্রে যদি query খালি থাকে তবে আগের মেসেজটাই ধরা হবে না, তাই রিটার্ন
      if (!query) return;

      try {
        // API কল করার আগে টাইপিং দেখানো
        api.sendTypingIndicator(threadID);

        // একটি সচল AI API ব্যবহার করা হয়েছে
        const res = await axios.get(`https://api.samir.tech/gpt4?text=${encodeURIComponent(query)}`);
        const respond = res.data.answer || res.data.response || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।";

        return api.sendMessage(respond, threadID, messageID);
      } catch (error) {
        // console.error(error); // এরর চেক করার জন্য কনসোলে দেখতে পারেন
        return; // কোনো এরর হলে সাইলেন্ট থাকবে
      }
    }
  },

  // মূল কমান্ড হিসেবেও রাখা হলো (প্রিক্স সহ কাজ করার জন্য)
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) return api.sendMessage("দয়া করে আপনার প্রশ্নটি লিখুন।", threadID, messageID);

    try {
      const res = await axios.get(`https://api.samir.tech/gpt4?text=${encodeURIComponent(query)}`);
      const respond = res.data.answer || res.data.response;
      return api.sendMessage(respond, threadID, messageID);
    } catch (error) {
      return api.sendMessage("সার্ভারে সমস্যা হচ্ছে।", threadID, messageID);
    }
  }
};
