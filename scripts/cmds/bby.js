const axios = require('axios');

const nicknames = ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"];

module.exports = {
  config: {
    name: "Citti",
    aliases: ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"],
    version: "2.6",
    author: "AkHi",
    countDown: 3,
    role: 0,
    description: "Chat with Citti AI without prefix and via replies.",
    category: "chat",
    guide: "{pn} <message> (or just call its name)",
    usePrefix: false 
  },

  // অনচ্যাট ইভেন্ট: প্রিফিক্স ছাড়া কাজ করার প্রধান অংশ
  onChat: async function ({ api, message, event, usersData }) {
    if (!event.body) return;
    const body = event.body.toLowerCase();
    
    // নিকনেম চেক
    const isNickname = nicknames.some(name => body.startsWith(name) || body.includes(name));
    // বটের মেসেজে রিপ্লাই চেক
    const isReplyToBot = event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID();

    if (isNickname || isReplyToBot) {
      // রিপ্লাই চেইন চেক (নিশ্চিত করা যে এই কমান্ডেরই রিপ্লাই হচ্ছে)
      if (isReplyToBot && !global.GoatBot.onReply.has(event.messageReply.messageID)) return;
      
      await handleChat(event.body, message, event, api, usersData, this.config.name);
    }
  },

  onStart: async function ({ api, message, args, event, usersData }) {
    const input = args.join(" ").trim();
    if (!input) return message.reply("💬 Hello! I am Citti. How can I help you today?");
    await handleChat(input, message, event, api, usersData, this.config.name);
  },

  onReply: async function ({ api, message, event, Reply, usersData }) {
    if (event.senderID !== Reply.author) return;
    await handleChat(event.body, message, event, api, usersData, this.config.name, Reply.session);
  }
};

async function handleChat(input, message, event, api, usersData, commandName, oldSession = null) {
  const userId = event.senderID;
  const session = oldSession || `pi-${userId}`;
  
  // র‍্যান্ডম রিঅ্যাকশন লিস্ট থেকে একটি রিঅ্যাকশন দেওয়া
  const reacts = ["😊", "🌸", "😄", "🫡", "🙂", "😚", "😍", "🥹", "💝", "🐱", "💚", "🦋", "🥺", "🌚"];
  const randomReact = reacts[Math.floor(Math.random() * reacts.length)];
  api.setMessageReaction(randomReact, event.messageID, () => {}, true);

  try {
    // ভয়েস প্যারামিটার সরিয়ে ফেলা হয়েছে
    let res = await callPi(input, session);
    
    if (!res?.text) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Citti is currently unavailable.");
    }

    let replyText = res.text;
    
    // Identity Filtering
    replyText = replyText.replace(/Pi AI|Pi|Inflection AI/gi, "Citti");
    const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে/gi;
    
    if (creatorRegex.test(input.toLowerCase()) || creatorRegex.test(replyText.toLowerCase())) {
        replyText = "I was created and developed by Lubna Jannat AkHi. She is my master and developer.";
    }

    // Usage tracking
    const currentCount = await usersData.get(userId, "data.pi_usageCount") || 0;
    await usersData.set(userId, currentCount + 1, "data.pi_usageCount");

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    
    return message.reply({ body: replyText }, (err, info) => {
      if (!err) {
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
    return message.reply("⚠️ Error: " + err.message);
  }
}

async function callPi(query, session) {
  const addrRes = await axios.get("https://raw.githubusercontent.com/Tanvir0999/stuffs/refs/heads/main/raw/addresses.json");
  let baseUrl = addrRes.data.public;
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  // ভয়েস এবং মডেল প্যারামিটার বাদ দিয়ে সিম্পল কল
  const { data } = await axios.get(`${baseUrl}/pi?query=${encodeURIComponent(query)}&session=${encodeURIComponent(session)}`);
  return data.data;
                     }
