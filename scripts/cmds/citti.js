const axios = require("axios");

module.exports = {
  config: {
    name: "citti",
    version: "2.5.0",
    role: 0,
    author: "AkHi and Sabu",
    description: "Citti AI bot with Gemini 2.5 Flash support",
    category: "chat",
    guide: "{pn} <question>",
    countDown: 5
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, messageReply } = event;
    
    // ১. কন্ডিশন: যদি মেসেজ "citti" দিয়ে শুরু হয় অথবা যদি কেউ চিত্তির কোনো মেসেজে রিপ্লাই দেয়
    const isCittiStart = body && body.toLowerCase().startsWith("citti");
    const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

    if (isCittiStart || isReplyToBot) {
      let prompt = isCittiStart ? body.slice(5).trim() : body;

      // যদি প্রশ্ন না থাকে
      if (!prompt && isCittiStart) {
        return api.sendMessage("জি! আমি Citti বলছি। আপনাকে কীভাবে সাহায্য করতে পারি?", threadID, messageID);
      } else if (!prompt) return;

      try {
        // config.json থেকে Gemini এর তথ্যগুলো নিচ্ছে
        const geminiConfig = global.config.GEMINI;
        const apiKey = geminiConfig.API_Key;
        // আপনার স্ক্রিনশট অনুযায়ী মডেল নাম gemini-2.5-flash সেট করা হয়েছে
        const model = "gemini-2.5-flash"; 
        const systemInstruction = geminiConfig.SystemInstruction;

        // Gemini API কল
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const res = await axios.post(url, {
          contents: [
            {
              role: "user",
              parts: [{ text: `System Instruction: ${systemInstruction}\n\nUser Question: ${prompt}` }]
            }
          ]
        }, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        // রেসপন্স চেক করা এবং উত্তর পাঠানো
        if (res.data && res.data.candidates && res.data.candidates[0].content) {
          const reply = res.data.candidates[0].content.parts[0].text;
          api.sendMessage(reply, threadID, messageID);
        } else {
          throw new Error("Invalid API Response");
        }

      } catch (error) {
        console.error("Gemini Error:", error.response ? error.response.data : error.message);
        api.sendMessage("দুঃখিত, এই মুহূর্তে আমি একটু ব্যস্ত আছি। আমার API Key বা মডেলের নাম চেক করুন।", threadID, messageID);
      }
    }
  },

  onStart: async function ({ api, event }) {
    api.sendMessage("অনুগ্রহ করে 'citti' লিখে আপনার প্রশ্নটি করুন।", event.threadID, event.messageID);
  }
};
