const axios = require('axios');
const API_ENDPOINT = 'https://metakexbyneokex.fly.dev/chat';

module.exports = {
  config: {
    name: "bby",
    version: "2.5.0",
    role: 0,
    author: "AkHi",
    description: "Chat with Meta Ai (Prefix-less)",
    category: "chat",
    usages: "[message]",
    cooldowns: 0, // দ্রুত রেসপন্সের জন্য ০ করে দেওয়া হয়েছে
    // এই অংশটি নিশ্চিত করুন
  },

  onChat: async function ({ api, event, message }) {
    const { threadID, messageID, body, senderID, messageReply } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const bodyLower = body.toLowerCase();
    
    const matchedKeyword = keywords.find(word => bodyLower.startsWith(word));
    const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

    if (matchedKeyword || isReplyToBot) {
      let query = matchedKeyword ? body.slice(matchedKeyword.length).trim() : body.trim();

      // শুধু নাম ধরে ডাকলে উত্তর
      if (matchedKeyword && !query) {
        const nicknames = {
          "citti": "জি! আমি Citti বলছি।",
          "চিট্টি": "জি জানু, বলো কী সাহায্য করতে পারি?",
          "baby": "জি বেবি! বলো শুনছি।",
          "bby": "জি সোনা! বলো কী হয়েছে?",
          "hinata": "হ্যাঁ, আমি হিনাতা। তোমাকে কীভাবে সাহায্য করতে পারি?",
          "bot": "জি, আমি একটি এআই বট।"
        };
        return api.sendMessage(nicknames[matchedKeyword] || "জি! শুনছি।", threadID, messageID);
      }

      // পরিচয় চেক
      const identityQuery = query.toLowerCase();
      if (identityQuery.includes("নাম কি") || identityQuery.includes("name")) {
        return api.sendMessage("আমার নাম চিট্টি (Citti)।", threadID, messageID);
      }
      if (identityQuery.includes("বানাইছে") || identityQuery.includes("owner")) {
        return api.sendMessage("আমাকে Lubna Jannat AkHi তৈরি করেছেন।", threadID, messageID);
      }

      try {
        const fullResponse = await axios.post(API_ENDPOINT, { 
            message: query, 
            new_conversation: true, 
            cookies: {} 
        }, { timeout: 15000 });
        
        const aiMessage = fullResponse.data.message;
        if (aiMessage) {
            return api.sendMessage(aiMessage, threadID, messageID);
        }
      } catch (error) {
        console.error("AI Error:", error.message);
      }
    }
  },

  // prefix দিয়ে কাজ করার জন্য (যদি onChat ফেইল করে)
  onStart: async function ({ api, event, args }) {
      const query = args.join(" ");
      if (!query) return api.sendMessage("জি বলুন!", event.threadID, event.messageID);
      
      try {
        const res = await axios.post(API_ENDPOINT, { message: query, new_conversation: true });
        return api.sendMessage(res.data.message, event.threadID, event.messageID);
      } catch (e) {
          return api.sendMessage("সার্ভার সমস্যা।", event.threadID);
      }
  }
};
      
