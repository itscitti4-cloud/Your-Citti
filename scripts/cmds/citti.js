const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = {
  config: {
    name: "citti", 
    version: "6.5.0",
    author: "AkHi",
    role: 0,
    category: "Chat",
    guide: "{pn} <message>",
    countDown: 0,
    hasPrefix: false // Prefix ছাড়া কাজ করার জন্য
  },

  // এটি কমান্ড লিস্টে নাম দেখানোর জন্য সাহায্য করবে
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    if (args.length === 0) return api.sendMessage("জি! আমি Citti বলছি। কিছু বলতে চাইলে লিখুন।", threadID, messageID);
    
    // কমান্ড হিসেবে ব্যবহার করলে (যেমন: !citti hello)
    const prompt = args.join(" ");
    return await this.getGeminiResponse({ api, event, prompt });
  },

  // এটি নাম ধরে ডাকলে বা রিপ্লাই দিলে কাজ করবে
  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, messageReply, senderID } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const bodyLower = body.toLowerCase().trim();
    
    const matchedKeyword = keywords.find(word => bodyLower.startsWith(word));
    const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

    if (matchedKeyword || isReplyToBot) {
      // শুধু নাম ধরে ডাকলে
      if (matchedKeyword && bodyLower === matchedKeyword) {
        const nicknames = {
            "citti": "জি! আমি Citti বলছি।",
            "চিট্টি": "জি জানু, বলো কী সাহায্য করতে পারি?",
            "baby": "জি বেবি! বলো শুনছি।",
            "bby": "জি সোনা! বলো কী হয়েছে?",
            "hinata": "হ্যাঁ, আমি হিনাতা। তোমাকে কীভাবে সাহায্য করতে পারি?",
            "bot": "জি, আমি একটি এআই বট।"
        };
        return api.sendMessage(nicknames[matchedKeyword] || "জি! আমি শুনছি।", threadID, messageID);
      }

      let prompt = isReplyToBot ? body : body.slice(matchedKeyword.length).trim();
      if (!prompt) return;

      return await this.getGeminiResponse({ api, event, prompt });
    }
  },

  // এআই রেসপন্স হ্যান্ডলার
  getGeminiResponse: async function ({ api, event, prompt }) {
    const { threadID, messageID } = event;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return console.error("Error: GEMINI_API_KEY missing!");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "Your name is Citti. Developed by Lubna Jannat Akhi. Answer in Bengali, English, or Banglish naturally. Keep answers short and friendly."
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      if (responseText) api.sendMessage(responseText, threadID, messageID);
    } catch (error) {
      console.error("Gemini AI Error:", error.message);
    }
  }
};

