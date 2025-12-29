const axios = require('axios');

module.exports = {
  config: {
    name: "citti",
    version: "2.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Chat with Citti.",
    category: "chat",
    guide: {
      en: "call 'citti' or reply to its message to chat."
    }
  },

  onChat: async function ({ message, event, usersData }) {
    if (!event.body) return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const messageContent = event.body.toLowerCase().trim();
    
    const matchedKeyword = keywords.find(word => messageContent.includes(word));

    if (matchedKeyword) {
      const userId = event.senderID;
      const session = `pi-${userId}`;

      // যদি শুধু কিওয়ার্ড থাকে
      if (messageContent === matchedKeyword) {
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
            commandName: this.config.name,
            author: userId,
            session: session 
          });
        });
      } else {
        // কিওয়ার্ডের সাথে প্রশ্ন থাকলে
        return this.handlePiRequest(event.body, message, event, usersData);
      }
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    const input = args.join(" ").trim();
    if (!input) return message.reply("❌ আপনি কিছু লেখেননি।");
    return this.handlePiRequest(input, message, event, usersData);
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    // রিপ্লাই দিলে এই সেকশনটি কাজ করবে
    const { author, session } = Reply;
    if (event.senderID !== author) return; // যে মেসেজ দিয়েছে শুধু সেই রিপ্লাই দিতে পারবে

    const input = event.body?.trim();
    if (!input) return;

    return this.handlePiRequest(input, message, event, usersData, session);
  },

  handlePiRequest: async function (input, message, event, usersData, oldSession) {
    const userId = event.senderID;
    const session = oldSession || `pi-${userId}`;

    try {
      const reactions = ["❤️", "💖", "😘", "😍", "✨", "🌸", "🎀", "😇", "🔥", "😻", "💙", "🤞", "🍭", "🧸", "🐣", "🌈", "🍓", "💎", "💞", "🌹"];
      message.reaction(reactions[Math.floor(Math.random() * reactions.length)], event.messageID);

      let prompt = input;
      // ভাষা নির্ধারণ
      if (/[\u0980-\u09FF]/.test(input)) {
          prompt = `Answer in Bengali. No English: ${input}`;
      } else if (/([aeiou][a-z]*[aeiou])/gi.test(input) && !/^[a-z\s.,!?]+$/i.test(input)) {
          prompt = `Reply in Banglish: ${input}`;
      }

      const res = await callPi(prompt, session);
      if (!res?.text) return;

      let replyText = res.text;

      // মেকার ফিল্টার
      const creatorKeywords = ["developer", "creator", "owner", "তৈরি", "মালিক", "ডেভেলপার"];
      const isAskingAboutCreator = creatorKeywords.some(word => input.toLowerCase().includes(word));

      if (isAskingAboutCreator) {
          replyText = "I was created and developed by AkHi. She is my master and developer.";
      } else {
          replyText = replyText.replace(/Pi AI|Pi|Inflection AI/gi, "Citti");
      }

      return message.reply(replyText.trim(), (err, info) => {
        if (err) return;
        // সেশন সেভ করা যাতে পরের রিপ্লাই কাজ করে
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
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
