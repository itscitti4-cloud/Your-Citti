const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = {
  config: {
    name: "bby", // কমান্ড লিস্টে এই নামে দেখাবে
    version: "2.6.0",
    role: 0,
    author: "AkHi",
    description: "Chat with Google Gemini AI (Short & Friendly)",
    category: "chat",
    usages: "[message]",
    cooldowns: 0,
    hasPrefix: false // Prefix ছাড়া কাজ করার জন্য
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    
    if (!query) return api.sendMessage("জি জানু! কিছু তো বলো। শুধু শুধু ডাকলে হবে? 🙄", threadID, messageID);
    
    return await this.getGeminiResponse({ api, event, prompt: query });
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, messageReply, senderID } = event;
    
    if (!body || senderID == api.getCurrentUserID()) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const bodyLower = body.toLowerCase().trim();
    
    const matchedKeyword = keywords.find(word => bodyLower.startsWith(word));
    const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

    if (matchedKeyword || isReplyToBot) {
      
      // শুধু নাম ধরে ডাকলে ফানি উত্তর
      if (matchedKeyword && bodyLower === matchedKeyword) {
        const nicknames = [
          "জি জানু, বলো কী সাহায্য করতে পারি? 😉",
          "উফ! এভাবে ডাকলে তো প্রেমে পড়ে যাবো। বলো কী খবর?",
          "জি সোনা! শুনছি, ঝটপট বলে ফেলো।",
          "হুম বলো, খুব ব্যস্ত নাকি? 😜"
        ];
        return api.sendMessage(nicknames[Math.floor(Math.random() * nicknames.length)], threadID, messageID);
      }

      // ডেভেলপার সংক্রান্ত প্রশ্ন চেক
      const creatorQueries = ["tmk ke banaiche", "tomake ke banaiche", "tomar admin ke", "ke banaiche", "owner ke", "creator ke", "কে বানিয়েছে"];
      if (creatorQueries.some(q => bodyLower.includes(q))) {
        return api.sendMessage("আমাকে কিউট 'Lubna Jannat AkHi' তৈরি করেছেন। সে-ই আমার সব! 😍", threadID, messageID);
      }

      // প্রম্পট ফিল্টার করা
      let prompt = isReplyToBot ? body : body.slice(matchedKeyword.length).trim();
      if (!prompt) return;

      return await this.getGeminiResponse({ api, event, prompt });
    }
  },

  getGeminiResponse: async function ({ api, event, prompt }) {
    const { threadID, messageID } = event;
    try {
      // আপনার দেওয়া API Key এখানে বসানো হয়েছে
      const apiKey = "AIzaSyBbFzulfEGJBL40T-P5kov0WlBL7cM9ip8"; 
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "Your name is Citti. Developed by Lubna Jannat Akhi. Answer in a mix of Bengali and English (Banglish) with a funny and friendly tone. Keep responses very short."
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (responseText) {
        api.sendMessage(responseText, threadID, messageID);
      }
    } catch (error) {
      console.error("Gemini Error:", error.message);
      // api.sendMessage("সার্ভার একটু বিজি জানু, পরে ট্রাই করো! 🤧", threadID, messageID);
    }
  }
};
