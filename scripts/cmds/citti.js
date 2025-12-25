const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = {
  config: {
    name: "cittichat", 
    version: "6.5.0",
    author: "AkHi",
    role: 0,
    category: "Chat",
    guide: "{pn} <msg>",
    countDown: 0,
    // এটি নিশ্চিত করবে যে ! ছাড়াই কাজ করবে অনেক ফ্রেমওয়ার্কে
    hasPrefix: false 
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, messageReply, senderID } = event;
    
    // মেসেজ না থাকলে বা বটের নিজের মেসেজ হলে থামবে
    if (!body || !api.getCurrentUserID || senderID == api.getCurrentUserID()) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const bodyLower = body.toLowerCase().trim();
    
    // কি-ওয়ার্ড দিয়ে শুরু হয়েছে কি না অথবা বটের মেসেজে রিপ্লাই দেওয়া হয়েছে কি না
    const matchedKeyword = keywords.find(word => bodyLower.startsWith(word));
    const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

    if (matchedKeyword || isReplyToBot) {
      
      // শুধু নাম ধরে ডাকলে (কোনো প্রশ্ন ছাড়া)
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

      try {
        // API Key চেক
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.error("Error: GEMINI_API_KEY missing in environment variables!");
          return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: "Your name is Citti. Developed by Lubna Jannat Akhi. Answer in Bengali if asked in Bengali, in English if asked in English, or in Banglish. Keep answers short, friendly and relevant."
        });

        // প্রম্পট তৈরি: নাম বাদ দিয়ে শুধু প্রশ্নটি নেওয়া
        let prompt = body;
        if (matchedKeyword) {
          prompt = body.slice(matchedKeyword.length).trim();
        }
        
        // যদি নামের পর আর কিছু না থাকে (যেমন শুধু 'citti' রিপ্লাইতে)
        if (!prompt && isReplyToBot) prompt = body;
        if (!prompt) return;

        // এআই রেসপন্স জেনারেট
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (responseText) {
          api.sendMessage(responseText, threadID, messageID);
        }

      } catch (error) {
        console.error("Gemini AI Error:", error.message);
      }
    }
  }
};
      
