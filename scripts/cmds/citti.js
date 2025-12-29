const axios = require('axios');

module.exports = {
  config: {
    name: "citti",
    version: "1.6",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Multi-language (BN/EN/Banglish) support with auto-reaction.",
    category: "chat",
    guide: {
      en: " no prefix just call citti. chat with citti based on reply."
    }
  },

  onChat: async function ({ message, event }) {
    if (!event.body) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const messageContent = event.body.toLowerCase();
    const hasKeyword = keywords.some(word => messageContent.includes(word.toLowerCase()));

    if (hasKeyword) {
      // ২০টি র‍্যান্ডম রিঅ্যাকশন লিস্ট
      const reactions = ["❤️", "💖", "😘", "😊", "✨", "🌸", "🙈", "🔥", "🌈", "🦋", "🍭", "🎀", "🥰", "💌", "🧡", "💎", "🧸", "🎈", "🍫", "🌹"];
      const randomReact = reactions[Math.floor(Math.random() * reactions.length)];
      message.react(randomReact);

      const cuteReplies = [
        "জি জানু, বলো কী সাহায্য করতে পারি? 😉",
        "উফ! এভাবে ডাকলে তো প্রেমে পড়ে যাবো। বলো কী খবর?",
        "জি সোনা! শুনছি, ঝটপট বলে ফেলো।",
        "হুম বলো, খুব ব্যস্ত নাকি? 😜",
        "আমি চিট্টি বলছি, কিভাবে তোমাকে সাহায্য করতে পারি?",
        "Hlw I'm Citti, how can i help you?"
      ];

      const randomReply = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];
      const userId = event.senderID;
      const session = `pi-${userId}`;

      return message.reply(randomReply, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: userId,
          messageID: info.messageID,
          session
        });
      });
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    const input = args.join(" ").trim();
    if (!input) return message.reply("❌ আপনি কিছু লেখেননি।");
    return this.handlePiRequest(input, message, event, usersData);
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    const userId = event.senderID;
    if (userId !== Reply.author) return;

    const input = event.body?.trim();
    if (!input) return;

    return this.handlePiRequest(input, message, event, usersData, Reply.session);
  },

  handlePiRequest: async function (input, message, event, usersData, oldSession) {
    const userId = event.senderID;
    const session = oldSession || `pi-${userId}`;

    try {
      // ভাষা বজায় রাখার জন্য প্রম্পট ইঞ্জিনিয়ারিং
      const customPrompt = `User said: "${input}". Please respond naturally in the same language or style (Bengali, English, or Banglish) used by the user. Do not translate into English if not asked.`;
      
      const res = await callPi(customPrompt, session);
      
      const currentCount = await usersData.get(userId, "data.pi_usageCount") || 0;
      await usersData.set(userId, currentCount + 1, "data.pi_usageCount");

      if (!res?.text) return;

      let replyText = res.text;

      // ফিল্টার: নাম এবং মেকার পরিবর্তন
      replyText = replyText.replace(/Pi AI|Pi|Inflection AI/gi, "Citti");
      
      // অপ্রয়োজনীয় ট্রান্সলেশন লাইন রিমুভ করা
      replyText = replyText.replace(/The phrase ".*?" translates to ".*?" in English\./gi, "");

      const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে|ডেভেলপার/gi;
      if (creatorRegex.test(input.toLowerCase())) {
          replyText = "I was created and developed by Lubna Jannat AkHi. She is my master and developer.";
      }

      return message.reply(replyText.trim(), (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: userId,
          messageID: info.messageID,
          session
        });
      });

    } catch (err) {
      console.error("Pi AI Error: " + err.message);
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
