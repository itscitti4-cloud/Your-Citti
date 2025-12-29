const axios = require('axios');

module.exports = {
  config: {
    name: "citti",
    version: "2.8.0",
    author: "AkHi",
    countDown: 3,
    role: 0,
    description: "Chat with Citti AI with smart keyword and reply detection.",
    category: "chat",
    guide: {
      en: "call name or reply to bot message to chat"
    }
  },

  onChat: async function ({ api, event, message, usersData }) {
    if (!event.body) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const messageContent = event.body.toLowerCase().trim();
    
    // কিওয়ার্ড চেক
    const matchedKeyword = keywords.find(word => messageContent.startsWith(word));
    
    // বটকে রিপ্লাই দিয়েছে কি না চেক (নতুন সিস্টেম)
    const isReplyToBot = event.messageReply && event.messageReply.senderID == api.getCurrentUserID();

    if (matchedKeyword || isReplyToBot) {
      const userId = event.senderID;
      const session = `pi-${userId}`;

      // শুধু নাম ধরে ডাকলে কিউট রিপ্লাই
      if (matchedKeyword && messageContent === matchedKeyword) {
        const reactions = ["❤️", "💖", "😘", "😍", "✨", "🌸", "🎀", "😇", "🔥", "😻", "💙", "🤞", "🍭", "🧸", "🐣", "🌈", "🍓", "💎", "💞", "🌹"];
        message.reaction(reactions[Math.floor(Math.random() * reactions.length)], event.messageID);

        const cuteReplies = [
          "জি জানু, বলো কী সাহায্য করতে পারি? 😉",
          "উফ! এভাবে ডাকলে তো প্রেমে পড়ে যাবো। বলো কী খবর?",
          "জি সোনা! শুনছি, ঝটপট বলে ফেলো।",
          "হুম বলো, খুব ব্যস্ত নাকি? 😜",
          "আমি চিট্টি বলছি, কিভাবে তোমাকে সাহায্য করতে পারি?",
          "Hlw I'm Citti, how can i help you?"
        ];

        const randomReply = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];

        return message.reply(randomReply, (err, info) => {
          if (err) return;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "citti",
            author: userId,
            session: session
          });
        });
      } else {
        // কিওয়ার্ডের সাথে প্রশ্ন থাকলে বা রিপ্লাই দিলে সরাসরি AI প্রসেস করবে
        let inputQuery = matchedKeyword ? event.body.slice(matchedKeyword.length).trim() : event.body.trim();
        return this.handlePiRequest(inputQuery, message, event, usersData, session);
      }
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    const input = args.join(" ").trim();
    if (!input) return message.reply("❌ আপনি কিছু লেখেননি।");
    return this.handlePiRequest(input, message, event, usersData);
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    if (event.senderID !== Reply.author) return;
    const input = event.body?.trim();
    if (!input) return;

    return this.handlePiRequest(input, message, event, usersData, Reply.session);
  },

  handlePiRequest: async function (input, message, event, usersData, oldSession) {
    const userId = event.senderID;
    const session = oldSession || `pi-${userId}`;

    try {
      const reactions = ["❤️", "💖", "😘", "😍", "✨", "🌸", "🎀", "😇", "🔥", "😻", "💙", "🤞", "🍭", "🧸", "🐣", "🌈", "🍓", "💎", "💞", "🌹"];
      message.reaction(reactions[Math.floor(Math.random() * reactions.length)], event.messageID);

      let prompt = input;
      if (/[\u0980-\u09FF]/.test(input)) {
          prompt = `Answer in Bengali. No English translation: ${input}`;
      } else if (/([aeiou][a-z]*[aeiou])/gi.test(input) && !/^[a-z\s.,!?]+$/i.test(input)) {
          prompt = `Reply in Banglish: ${input}`;
      }

      const res = await callPi(prompt, session);
      if (!res?.text) return;

      let replyText = res.text;

      // মেকার ফিল্টার
      const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে|ডেভেলপার/gi;
      if (creatorRegex.test(input.toLowerCase())) {
          replyText = "I was created and developed by Lubna Jannat AkHi. She is my master and developer.";
      } else {
          replyText = replyText.replace(/Pi AI|Pi|Inflection AI/gi, "Citti");
          replyText = replyText.replace(/The phrase ".*?" translates to ".*?" in English\./gi, "");
          replyText = replyText.replace(/In Bengali, ".*?" means ".*?"\./gi, "");
      }

      return message.reply(replyText.trim(), (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "citti",
          author: userId,
          session: session
        });
      });

    } catch (err) {
      console.error("Citti AI Error: " + err.message);
    }
  }
};

async function callPi(query, session) {
  try {
    const { data: { public: baseUrl } } = await axios.get("https://raw.githubusercontent.com/Tanvir0999/stuffs/refs/heads/main/raw/addresses.json");
    const { data } = await axios.get(`${baseUrl}/pi?query=${encodeURIComponent(query)}&session=${encodeURIComponent(session)}&voice=false`);
    return data.data;
  } catch (error) {
    throw new Error("API Connection Error");
  }
}
