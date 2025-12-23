const axios = require("axios");

module.exports = {
  config: {
    name: "citti",
    version: "3.2.0",
    role: 0,
    author: "AkHi",
    description: "Gemini AI - Direct Text Response",
    category: "chat",
    guide: "{pn} <question>",
    countDown: 2
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, messageReply, senderID } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const bodyLower = body.toLowerCase();
    const isCittiStart = bodyLower.startsWith("citti");
    const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();

    if (isCittiStart || isReplyToBot) {
      // "citti" শব্দটুকু বাদ দিয়ে বাকি প্রশ্নটি নেওয়া
      let prompt = isCittiStart ? body.slice(5).trim() : body.trim();

      // যদি শুধু "citti" লিখে মেসেজ দেয়
      if (isCittiStart && !prompt) {
        return api.sendMessage("জি! আমি Citti বলছি। আপনাকে কীভাবে সাহায্য করতে পারি?", threadID, messageID);
      }

      try {
        const apiKey = "AIzaSyBbFzulfEGJBL40T-P5kov0WlBL7cM9ip8"; 
        const model = "gemini-1.5-flash";
        
        const systemInstruction = "You are Chitti. Developed by Lubna Jannat AkHi. Answer in Bengali if asked in Bengali, English if asked in English. Give short and direct answers.";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const res = await axios.post(url, {
          contents: [{
            parts: [{ text: `System: ${systemInstruction}\nUser: ${prompt}` }]
          }]
        });

        if (res.data && res.data.candidates && res.data.candidates[0].content) {
          const replyText = res.data.candidates[0].content.parts[0].text;
          
          // সরাসরি টেক্সট পাঠানো (স্টাইল ছাড়া)
          api.sendMessage(replyText, threadID, messageID);
        }

      } catch (error) {
        console.error("Gemini Error:", error.response ? JSON.stringify(error.response.data) : error.message);
      }
    }
  },

  onStart: async function ({ api, event }) {
    api.sendMessage("অনুগ্রহ করে শুধু 'citti' লিখে প্রশ্ন করুন।", event.threadID, event.messageID);
  }
};
