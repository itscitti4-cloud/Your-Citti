const axios = require('axios');
const API_ENDPOINT = 'https://metakexbyneokex.fly.dev/chat';

module.exports = {
  config: {
    name: "bby",
    version: "2.9.0",
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
    
    // শুধু এই কমান্ডের মেসেজের রিপ্লাই হলে রেসপন্স করবে
    const isReplyToThisBot = messageReply && 
                             messageReply.senderID == api.getCurrentUserID() &&
                             (messageReply.body.includes("citti") || messageReply.body.includes("বট") || messageReply.body.includes("janu") || messageReply.body.includes("বলো"));

    if (matchedKeyword || isReplyToThisBot) {
      let query = matchedKeyword ? body.slice(matchedKeyword.length).trim() : body.trim();

      // নাম ধরে ডাকলে ফানি রিপ্লাই
      if (matchedKeyword && !query) {
        const nicknames = [
          "জি জানু, বলো কী সাহায্য করতে পারি? 😉",
          "উফ! এভাবে ডাকলে তো প্রেমে পড়ে যাবো। বলো কী খবর?",
          "জি সোনা! শুনছি, ঝটপট বলে ফেলো।",
          "হুম বলো, খুব ব্যস্ত নাকি? 😜"
        ];
        return api.sendMessage(nicknames[Math.floor(Math.random() * nicknames.length)], threadID, messageID);
      }

      // ডেভেলপার/ওনার সংক্রান্ত প্রশ্নের নতুন লজিক
      const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে|ডেভেলপার/gi;
      if (creatorRegex.test(bodyLower)) {
          return api.sendMessage("I was created and developed by Lubna Jannat AkHi. She is my master and developer.", threadID, messageID);
      }

      // ভাষা নির্ধারণ লজিক
      let finalPrompt = query;
      if (/[\u0980-\u09FF]/.test(query)) {
          finalPrompt = `Answer in Bengali. No English translation. Be funny and short (1-2 sentences): ${query}`;
      } else if (/([aeiou][a-z]*[aeiou])/gi.test(query) && !/^[a-z\s.,!?]+$/i.test(query)) {
          finalPrompt = `Reply in Banglish (Bengali written in English letters). Be funny and short (1-2 sentences): ${query}`;
      } else {
          finalPrompt = `Answer shortly in English. Be funny: ${query}`;
      }

      try {
        const fullResponse = await axios.post(API_ENDPOINT, { 
            message: `Instruction: You are an AI named citti. Be funny. Question: ${finalPrompt}`, 
            new_conversation: false,
            cookies: {} 
        }, { timeout: 15000 });
        
        let aiMessage = fullResponse.data.message;
        
        // সেফটি ফিল্টার
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
      
      const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে|ডেভেলপার/gi;
      if (creatorRegex.test(query.toLowerCase())) {
          return api.sendMessage("I was created and developed by Lubna Jannat AkHi. She is my master and developer.", event.threadID, event.messageID);
      }

      let finalPrompt = query;
      if (/[\u0980-\u09FF]/.test(query)) {
          finalPrompt = `Answer in Bengali. No English: ${query}`;
      } else if (/([aeiou][a-z]*[aeiou])/gi.test(query)) {
          finalPrompt = `Reply in Banglish: ${query}`;
      }

      try {
        const res = await axios.post(API_ENDPOINT, { 
            message: `Answer shortly and funny: ${finalPrompt}`, 
            new_conversation: true 
        });
        return api.sendMessage(res.data.message, event.threadID, event.messageID);
      } catch (e) {
          return api.sendMessage("সার্ভার একটু বিজি, পরে ট্রাই করো সুইটহার্ট! 🤧", event.threadID);
      }
  }
};
