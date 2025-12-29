const axios = require('axios');

const nicknames = ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"];

module.exports = {
  config: {
    name: "Citti",
    aliases: ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"],
    version: "2.7",
    author: "AkHi",
    countDown: 3,
    role: 0,
    description: "Chat with Citti like a Artificial Intelligence.",
    category: "chat",
    guide: "call name and chat on reply based",
    usePrefix: false // এটি GoatBot-এ প্রিফিক্স ছাড়াই কমান্ড রান করতে সাহায্য করে
  },

  // handleEvent ব্যবহার করা হয়েছে যাতে প্রতিটা মেসেজ চেক হয়
  handleEvent: async function ({ api, message, event, usersData }) {
    if (!event.body || event.senderID === api.getCurrentUserID()) return;
    
    const body = event.body.toLowerCase();
    
    // ১. নাম ধরে ডাকলে কি না চেক
    const isNickname = nicknames.some(name => body.includes(name));
    
    // ২. বটের করা মেসেজে রিপ্লাই কি না চেক
    const isReplyToBot = event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID();

    if (isNickname || isReplyToBot) {
        // যদি রিপ্লাই হয় তবে সেটা যেন এই কমান্ডেরই রিপ্লাই হয়
        if (isReplyToBot && !global.GoatBot.onReply.has(event.messageReply.messageID)) return;
        
        await handleChat(event.body, message, event, api, usersData, "Citti");
    }
  },

  // প্রিফিক্স দিয়ে লিখলে (যেমন: !citti)
  onStart: async function ({ api, message, args, event, usersData }) {
    const input = args.join(" ").trim();
    if (!input) return message.reply("💬 Hello! I am Citti. How can I help you today?");
    await handleChat(input, message, event, api, usersData, this.config.name);
  },

  // রিপ্লাই চেইনের জন্য
  onReply: async function ({ api, message, event, Reply, usersData }) {
    if (event.senderID !== Reply.author) return;
    await handleChat(event.body, message, event, api, usersData, this.config.name, Reply.session);
  }
};

async function handleChat(input, message, event, api, usersData, commandName, oldSession = null) {
  const userId = event.senderID;
  const session = oldSession || `pi-${userId}`;
  
  // রিঅ্যাকশন সিস্টেম
  const reacts = ["😊", "🌸", "😄", "🫡", "🙂", "😚", "😍", "🥹", "💝", "🐱", "💚", "🦋", "🥺", "🌚"];
  const randomReact = reacts[Math.floor(Math.random() * reacts.length)];
  api.setMessageReaction(randomReact, event.messageID, () => {}, true);

  try {
    // পিউওর কোড ফিল্টার: !citti বা citti থাকলে সেটা রিমুভ করে API-তে পাঠানো
    let cleanInput = input;
    nicknames.forEach(name => {
        if (cleanInput.toLowerCase().startsWith(name)) {
            cleanInput = cleanInput.slice(name.length).trim();
        }
    });

    // API কল
    const res = await callPi(cleanInput || input, session);
    
    if (!res?.text) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Citti is currently unavailable.");
    }

    let replyText = res.text;
    
    // ফিল্টারিং
    replyText = replyText.replace(/Pi AI|Pi|Inflection AI/gi, "Citti");
    const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে/gi;
    
    if (creatorRegex.test(input.toLowerCase()) || creatorRegex.test(replyText.toLowerCase())) {
        replyText = "I was created and developed by Lubna Jannat AkHi. She is my master and developer.";
    }

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
    // ৫০০ এরর হ্যান্ডেলিং
    console.error(err);
    return message.reply("⚠️ Error: Request failed with status code 500. API server might be down.");
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
