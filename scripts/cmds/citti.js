const axios = require('axios');

module.exports = {
  config: {
    name: "citti",
    version: "2.1",
    author: "AkHi",
    countDown: 3,
    role: 0,
    description: "Chat with Citti like a Artificial Intelligence.",
    category: "chat",
    guide: {
      en: "call 'citti' or reply to message to chat with citti."
    }
  },

  onChat: async function ({ message, event, usersData }) {
    if (!event.body) return;

    // যদি এটি কোনো মেসেজের রিপ্লাই হয়, তবে onChat কাজ করবে না (onReply হ্যান্ডেল করবে)
    if (event.type === "message_reply") return;

    const keywords = ["citti", "চিট্টি", "বেবি", "হিনাতা", "বট", "bby", "baby", "hinata", "bot"];
    const messageContent = event.body.toLowerCase().trim();
    
    const matchedKeyword = keywords.find(word => messageContent.includes(word));

    if (matchedKeyword) {
      const userId = event.senderID;
      const session = `pi-${userId}`;

      // শুধু নাম ধরে ডাকলে কিউট রিপ্লাই
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
        // নামের সাথে প্রশ্ন থাকলে
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
    const { author, session, commandName } = Reply;
    
    // নিশ্চিত করা হচ্ছে এটি এই কমান্ডেরই রিপ্লাই
    if (commandName !== this.config.name) return;
    if (event.senderID !== author) return;

    const input = event.body?.trim();
    if (!input) return;

    // রিপ্লাই দিলে সরাসরি AI হ্যান্ডলারে পাঠানো হচ্ছে
    return this.handlePiRequest(input, message, event, usersData, session);
  },

  handlePiRequest: async function (input, message, event, usersData, oldSession) {
    const userId = event.senderID;
    const session = oldSession || `pi-${userId}`;

    try {
      const reactions = ["❤️", "💖", "😘", "😍", "✨", "🌸", "🎀", "😇", "🔥", "😻", "💙", "🤞", "🍭", "🧸", "🐣", "🌈", "🍓", "💎", "💞", "🌹"];
      message.reaction(reactions[Math.floor(Math.random() * reactions.length)], event.messageID);

      let prompt = input;
      if (/[\u0980-\u09FF]/.test(input)) {
          prompt = `Answer in Bengali: ${input}`;
      } else if (/([aeiou][a-z]*[aeiou])/gi.test(input) && !/^[a-z\s.,!?]+$/i.test(input)) {
          prompt = `Reply in Banglish: ${input}`;
      }

      const res = await callPi(prompt, session);
      if (!res?.text) return;

      let replyText = res.text;

      const creatorKeywords = ["developer", "creator", "owner", "তৈরি", "মালিক", "ডেভেলপার"];
      const isAskingAboutCreator = creatorKeywords.some(word => input.toLowerCase().includes(word));

      if (isAskingAboutCreator) {
          replyText = "I was created and developed by AkHi. She is my master and developer.";
      } else {
          replyText = replyText.replace(/Pi AI|Pi|Inflection AI/gi, "Citti");
      }

      return message.reply(replyText.trim(), (err, info) => {
        if (err) return;
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
