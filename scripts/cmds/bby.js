const axios = require('axios');

module.exports = {
  config: {
    name: "pi",
    version: "1.5",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "নাম ধরে ডাকলে কিউট রিপ্লাই দেবে এবং ফিল্টার সহ চ্যাট করবে।",
    category: "chat",
    guide: {
      en: "নামগুলো: citti, চিট্টি, বেবি, হিনাতা, বট, bby, baby, hinata, bot"
    }
  },

  onChat: async function ({ message, event }) {
    if (!event.body) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const messageContent = event.body.toLowerCase();
    const hasKeyword = keywords.some(word => messageContent.includes(word.toLowerCase()));

    if (hasKeyword) {
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
      const res = await callPi(input, session);
      
      const currentCount = await usersData.get(userId, "data.pi_usageCount") || 0;
      await usersData.set(userId, currentCount + 1, "data.pi_usageCount");

      if (!res?.text) return;

      let replyText = res.text;

      // --- ফিল্টার সেকশন শুরু ---
      // ১. নাম পরিবর্তন
      replyText = replyText.replace(/Pi AI|Pi|Inflection AI/gi, "Citti");

      // ২. মেকার/ডেভেলপার প্রশ্নের ফিল্টার
      const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে/gi;
      if (creatorRegex.test(input.toLowerCase()) || creatorRegex.test(replyText.toLowerCase())) {
          replyText = "I was created and developed by Lubna Jannat AkHi. She is my master and developer.";
      }
      // --- ফিল্টার সেকশন শেষ ---

      return message.reply(replyText, (err, info) => {
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
