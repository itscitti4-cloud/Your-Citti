const axios = require('axios');

const nicknames = ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"];

module.exports = {
  config: {
    name: "Citti",
    aliases: ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"],
    version: "2.8",
    author: "AkHi",
    countDown: 3,
    role: 0,
    description: "Chat with Citti AI without prefix and via replies.",
    category: "chat",
    guide: "{pn} <message> (or just call its name)",
    usePrefix: false
  },

  // প্রিফিক্স ছাড়া এবং রিপ্লাই ডিটেক্ট করার জন্য onChat ব্যবহার করা হয়েছে
  onChat: async function ({ api, message, event, usersData }) {
    if (!event.body || event.senderID === api.getCurrentUserID()) return;
    
    const body = event.body.toLowerCase();
    
    // ১. নাম ধরে ডাকলে কি না চেক
    const isNickname = nicknames.some(name => body.includes(name));
    
    // ২. বটের করা মেসেজে রিপ্লাই কি না চেক (রিপ্লাই সিস্টেম)
    const isReplyToBot = event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID();

    if (isNickname || isReplyToBot) {
        // রিপ্লাই দিলে যেন শুধুমাত্র এই কমান্ডেরই রিপ্লাই হয়
        if (isReplyToBot && !global.GoatBot.onReply.has(event.messageReply.messageID)) return;
        
        await handleChat(event.body, message, event, api, usersData, "Citti");
    }
  },

  // সরাসরি !Citti লিখলে কাজ করার জন্য
  onStart: async function ({ api, message, args, event, usersData }) {
    const input = args.join(" ").trim();
    if (!input) return message.reply("💬 Hello! I am Citti. How can I help you today?");
    await handleChat(input, message, event, api, usersData, this.config.name);
  },

  // রিপ্লাই চেইনের মেমোরি ধরে রাখার জন্য
  onReply: async function ({ api, message, event, Reply, usersData }) {
    if (event.senderID !== Reply.author) return;
    await handleChat(event.body, message, event, api, usersData, this.config.name, Reply.session);
  }
};

async function handleChat(input, message, event, api, usersData, commandName, oldSession = null) {
  const userId = event.senderID;
  const session = oldSession || `pi-${userId}`;
  
  // র‍্যান্ডম রিঅ্যাকশন
  const reacts = ["😊", "🌸", "😄", "🫡", "🙂", "😚", "😍", "🥹", "💝", "🐱", "💚", "🦋", "🥺", "🌚"];
  const randomReact = reacts[Math.floor(Math.random() * reacts.length)];
  api.setMessageReaction(randomReact, event.messageID, () => {}, true);

  try {
    // ইনপুট থেকে প্রিফিক্স বা নাম পরিষ্কার করা
    let cleanInput = input;
    if (cleanInput.startsWith("!")) cleanInput = cleanInput.slice(1);
    nicknames.forEach(name => {
      if (cleanInput.toLowerCase().startsWith(name)) {
        cleanInput = cleanInput.slice(name.length).trim();
      }
    });

    const res = await callPi(cleanInput || input, session);
    
    if (!res || !res.text) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Citti is currently busy. Try again later.");
    }

    let replyText = res.text;
    
    // নাম এবং ডেভেলপার ফিল্টারিং
    replyText = replyText.replace(/Pi AI|Pi|Inflection AI/gi, "Citti");
    const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে/gi;
    
    if (creatorRegex.test(input.toLowerCase()) || creatorRegex.test(replyText.toLowerCase())) {
        replyText = "I was created and developed by Lubna Jannat AkHi. She is my master and developer.";
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    
    return message.reply({ body: replyText }, (err, info) => {
      if (!err) {
        // রিপ্লাই চেইনে ডেটা সেভ করা
        global.GoatBot.onReply.set(info.messageID, {
          commandName: commandName,
          author: userId,
          messageID: info.messageID,
          session
        });
      }
    });

  } catch (err) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply("⚠️ API Error! Please try again later.");
  }
}

async function callPi(query, session) {
  try {
    const addrRes = await axios.get("https://raw.githubusercontent.com/Tanvir0999/stuffs/refs/heads/main/raw/addresses.json");
    let baseUrl = addrRes.data.public;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    const { data } = await axios.get(`${baseUrl}/pi?query=${encodeURIComponent(query)}&session=${encodeURIComponent(session)}`);
    return data.data;
  } catch (e) {
    return null;
  }
}
