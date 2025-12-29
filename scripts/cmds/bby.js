const axios = require('axios');

module.exports = {
  config: {
    name: "bby",
    version: "3.0.0",
    role: 0,
    author: "AkHi",
    description: "Chat with Pi AI (Short, Funny & Contextual)",
    category: "chat",
    usages: "[message]",
    cooldowns: 0,
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, senderID, messageReply } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const bodyLower = body.toLowerCase();
    
    const matchedKeyword = keywords.find(word => bodyLower.startsWith(word));
    const isReplyToThisBot = messageReply && 
                             messageReply.senderID == api.getCurrentUserID();

    if (matchedKeyword || isReplyToThisBot) {
      let query = matchedKeyword ? body.slice(matchedKeyword.length).trim() : body.trim();

      // শুধু নাম ধরে ডাকলে ফানি রিপ্লাই
      if (matchedKeyword && !query) {
        const nicknames = [
          "জি জানু, বলো কী সাহায্য করতে পারি? 😉",
          "উফ! এভাবে ডাকলে তো প্রেমে পড়ে যাবো। বলো কী খবর?",
          "জি সোনা! শুনছি, ঝটপট বলে ফেলো।",
          "হুম বলো, খুব ব্যস্ত নাকি? 😜"
        ];
        return api.sendMessage(nicknames[Math.floor(Math.random() * nicknames.length)], threadID, messageID);
      }

      // ডেভেলপার/ওনার সংক্রান্ত প্রশ্ন চেক
      const creatorQueries = ["tmk ke banaiche", "tomake ke banaiche", "tomar admin ke", "tmr admin ke", "tmr developer ke", "tomar developer ke", "কে বানিয়েছে", "owner ke", "creator ke", "who made you", "who is your boss"];
      
      if (creatorQueries.some(q => bodyLower.includes(q))) {
        return api.sendMessage("আমাকে 'Lubna Jannat (AkHi Ma'am)' তৈরি করেছে 😍", threadID, messageID);
      }

      try {
        // নতুন Pi AI API এন্ডপয়েন্ট
        const res = await axios.get(`https://api.sandipbaruwal.com.np/pi?prompt=${encodeURIComponent(query)}`);
        let aiMessage = res.data.answer;

        // ইনস্ট্রাকশন অনুযায়ী ছোট এবং ফানি ফিল্টার (যদি এপিআই থেকে বড় উত্তর আসে)
        if (aiMessage.toLowerCase().includes("meta") || aiMessage.toLowerCase().includes("facebook")) {
            aiMessage = "আমি Lubna Jannat AkHi Ma'am এর তৈরি করা Pi AI! আমার নাম citti😉";
        }

        return api.sendMessage(aiMessage, threadID, messageID);
      } catch (error) {
        console.error("Pi AI Error:", error.message);
      }
    }
  },

  onStart: async function ({ api, event, args }) {
      const query = args.join(" ");
      if (!query) return api.sendMessage("জি জানু! কিছু তো বলো। শুধু শুধু ডাকলে হবে? 🙄", event.threadID, event.messageID);
      
      try {
        const res = await axios.get(`https://api.sandipbaruwal.com.np/pi?prompt=${encodeURIComponent(query)}`);
        return api.sendMessage(res.data.answer, event.threadID, event.messageID);
      } catch (e) {
          return api.sendMessage("সার্ভার একটু বিজি, পরে ট্রাই করো সুইটহার্ট! 🤧", event.threadID);
      }
  }
};
