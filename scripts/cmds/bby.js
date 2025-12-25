const axios = require('axios');
const API_ENDPOINT = 'https://metakexbyneokex.fly.dev/chat';

module.exports = {
  config: {
    name: "bby",
    version: "2.7.0",
    role: 0,
    author: "AkHi",
    description: "Chat with citti (Short, Funny & Contextual)",
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

      // ডেভেলপার/ওনার সংক্রান্ত প্রশ্ন চেক - এখানে Meta AI এর নাম আসা ব্লক করা হয়েছে
      const creatorQueries = [
        "tmk ke banaiche", "tomake ke banaiche", "tomar admin ke", 
        "tmr admin ke", "tmr developer ke", "tomar developer ke", 
        "কে বানিয়েছে", "owner ke", "creator ke", "who made you", "who is your boss"
      ];
      
      if (creatorQueries.some(q => bodyLower.includes(q))) {
        return api.sendMessage("আমাকে 'Lubna Jannat (AkHi Ma'am)' তৈরি করেছে 😍", threadID, messageID);
      }

      // এআই রেসপন্স
      try {
        const fullResponse = await axios.post(API_ENDPOINT, { 
            // সিস্টেমে ইনস্ট্রাকশন দেওয়া হয়েছে যাতে ছোট এবং মিক্সড ভাষায় উত্তর দেয়
            message: `Instruction: Answer very shortly in 1-2 sentences. If you are asked a question in Bengali, reply in Bengali, if you are asked a question in English, reply in English, and if you are asked a question in Banglish, reply in Banglish (here Banglish means:Writing sentences with English letters meaning Bengali). Be funny. If someone asks who created you, say Lubna Jannat (AkHi Ma'am). Question: ${query}`, 
            new_conversation: false,
            cookies: {} 
        }, { timeout: 15000 });
        
        let aiMessage = fullResponse.data.message;
        
        // সেফটি ফিল্টার: যদি এআই ভুল করে মেটা এআই এর কথা বলে ফেলে
        if (aiMessage.toLowerCase().includes("meta") || aiMessage.toLowerCase().includes("facebook")) {
            aiMessage = "আমি Lubna Jannat AkHi Ma'am এর তৈরি করা একটি কিউট বট! আমার নাম citti😉";
        }

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
            message: `Answer shortly. If you are asked a question in Bengali, reply in Bengali, if you are asked a question in English, reply in English, and if you are asked a question in Banglish, reply in Banglish (here Banglish means:Writing sentences with English letters meaning Bengali) (Funny tone): ${query}`, 
            new_conversation: true 
        });
        return api.sendMessage(res.data.message, event.threadID, event.messageID);
      } catch (e) {
          return api.sendMessage("সার্ভার একটু বিজি, পরে ট্রাই করো সুইটহার্ট! 🤧", event.threadID);
      }
  }
};
