const axios = require('axios');
const API_ENDPOINT = 'https://metakexbyneokex.fly.dev/chat';

module.exports = {
  config: {
    name: "cit",
    version: "3.0.0",
    role: 0,
    author: "AkHi",
    description: "Chat with citti (Contextual, Funny & Multilingual)",
    category: "chat",
    usages: "[message]",
    cooldowns: 0,
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, senderID, messageReply } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const keywords = ["cit", "চিট্টি", "হিনাতা", "বট", "hin"];
    const bodyLower = body.toLowerCase();
    
    const matchedKeyword = keywords.find(word => bodyLower.startsWith(word));
    
    // রিপ্লাই চেক সহজ করা হয়েছে যাতে রিপ্লাই চেইন কেটে না যায়
    const isReplyToThisBot = messageReply && messageReply.senderID == api.getCurrentUserID();

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

      // ডেভেলপার এবং নাম সংক্রান্ত ফিক্সড রিপ্লাই
      const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে|ডেভেলপার/gi;
      const nameRegex = /তোমার নাম কি|tomar nam ki|tmr nam ki|your name/gi;

      if (creatorRegex.test(bodyLower)) {
          return api.sendMessage("I was created and developed by Lubna Jannat AkHi. She is my master and developer.", threadID, messageID);
      }
      if (nameRegex.test(bodyLower)) {
          return api.sendMessage("আমার নাম citti (চিট্টি)! তোমার কিউট একাউন্ট এর পার্সোনাল অ্যাসিস্ট্যান্ট। 😉", threadID, messageID);
      }

      // বাংলিশ এবং বাংলা ডিটেকশন লজিক ইমপ্রুভমেন্ট
      let systemInstruction = "You are citti, a funny AI. Answer in 1-2 sentences.";
      
      if (/[\u0980-\u09FF]/.test(query)) {
          systemInstruction += " Reply strictly in Bengali language only.";
      } else if (/[a-z]/i.test(query) && (query.includes("ki") || query.includes("kemon") || query.includes("tmr") || query.includes("tumi") || query.includes("khaba"))) {
          systemInstruction += " Reply in Banglish (Bengali words using English letters). Don't use pure English.";
      } else {
          systemInstruction += " Reply in the language the user is using.";
      }

      try {
        const fullResponse = await axios.post(API_ENDPOINT, { 
            message: `Instruction: ${systemInstruction}. User says: ${query}`, 
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
      
      try {
        const res = await axios.post(API_ENDPOINT, { 
            message: `You are citti, a funny AI. Answer shortly: ${query}`, 
            new_conversation: true 
        });
        return api.sendMessage(res.data.message, event.threadID, event.messageID);
      } catch (e) {
          return api.sendMessage("সার্ভার একটু বিজি, পরে ট্রাই করো সুইটহার্ট! 🤧", event.threadID);
      }
  }
}
