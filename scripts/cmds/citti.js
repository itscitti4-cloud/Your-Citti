const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = {
  config: {
    name: "citti",
    version: "6.0.0",
    author: "AkHi",
    role: 0,
    category: "Chat",
    guide: "{pn} <msg>",
    countDown: 2
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, messageReply, senderID } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const bodyLower = body.toLowerCase();
    const matchedKeyword = keywords.find(word => bodyLower.startsWith(word));
    const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

    if (matchedKeyword || isReplyToBot) {
      let prompt = matchedKeyword ? body.slice(matchedKeyword.length).trim() : body.trim();

      if (matchedKeyword && !prompt) {
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
        // Render Environment থেকে এপিআই কি নেওয়া
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // সিস্টেম ইন্সট্রাকশনটি প্রম্পটের সাথে যুক্ত করে দেওয়া (এটি বেশি কার্যকর)
        const fullPrompt = `System: Your name is Citti. Developed by Lubna Jannat AkHi. Reply in Bengali if possible.\nUser: ${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        api.sendMessage(text, threadID, messageID);

      } catch (error) {
        console.error("Gemini Error:", error.message);
      }
    }
  }
};
