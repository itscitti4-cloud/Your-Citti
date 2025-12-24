const axios = require('axios');
const API_ENDPOINT = 'https://metakexbyneokex.fly.dev/chat';

module.exports = {
  config: {
    name: "bby",
    version: "2.6.0",
    role: 0,
    author: "AkHi",
    description: "Chat with Citti (Funny & Contextual)",
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
    
    // চেক করা হচ্ছে রিপ্লাইটি কি এই নির্দিষ্ট "bby" কমান্ডের মেসেজের কি না
    const isReplyToThisBot = messageReply && 
                             messageReply.senderID == api.getCurrentUserID() && 
                             (messageReply.body.includes("চিট্টি") || messageReply.body.includes("Citti") || keywords.some(k => messageReply.body.toLowerCase().includes(k)));

    if (matchedKeyword || isReplyToThisBot) {
      let query = matchedKeyword ? body.slice(matchedKeyword.length).trim() : body.trim();

      // শুধু নাম ধরে ডাকলে শর্ট ও ফানি উত্তর
      if (matchedKeyword && !query) {
        const nicknames = [
          "জি জানু, বলো কী সাহায্য করতে পারি? 😉",
          "উফ! এভাবে ডাকলে তো প্রেমে পড়ে যাবো। বলো কী খবর?",
          "জি সোনা! শুনছি, ঝটপট বলে ফেলো।",
          "হুম বলো, খুব ব্যস্ত নাকি? 😜"
        ];
        return api.sendMessage(nicknames[Math.floor(Math.random() * nicknames.length)], threadID, messageID);
      }

      // ডেভেলপার/ওনার সংক্রান্ত প্রশ্ন চেক (Banglish + Bangla)
      const creatorQueries = [
        "tmk ke banaiche", "tomake ke banaiche", "tomar admin ke", 
        "tmr admin ke", "tmr developer ke", "tomar developer ke", 
        "কে বানিয়েছে", "owner ke", "creator ke"
      ];
      
      if (creatorQueries.some(q => bodyLower.includes(q))) {
        return api.sendMessage("আমাকে কিউট 'Lubna Jannat AkHi' তৈরি করেছেন। সে-ই আমার সব! 😍", threadID, messageID);
      }

      // এআই রেসপন্স
      try {
        const fullResponse = await axios.post(API_ENDPOINT, { 
            message: `Reply shortly in Mix Bangla and English with a funny tone: ${query}`, 
            new_conversation: false, // প্রসঙ্গ ধরে রাখার জন্য false
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

  onStart: async function ({ api, event, args }) {
      const query = args.join(" ");
      if (!query) return api.sendMessage("জি জানু! কিছু তো বলো। শুধু শুধু ডাকলে হবে? 🙄", event.threadID, event.messageID);
      
      try {
        const res = await axios.post(API_ENDPOINT, { 
            message: `Reply shortly in Mix Bangla and English with a funny tone: ${query}`, 
            new_conversation: true 
        });
        return api.sendMessage(res.data.message, event.threadID, event.messageID);
      } catch (e) {
          return api.sendMessage("সার্ভার একটু বিজি, পরে ট্রাই করো সুইটহার্ট! 🤧", event.threadID);
      }
  }
};
