const axios = require('axios');

const piVoiceModels = {
  1: "Pi 1 ✨", 2: "Pi 2 ✨", 3: "Pi 3 ✨", 4: "Pi 4",
  5: "Pi 5", 6: "Pi 6", 7: "Pi 7", 8: "Pi 8"
};

const nicknames = ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"];

module.exports = {
  config: {
    name: "Citti",
    aliases: ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"],
    version: "2.5",
    author: "AkHi",
    countDown: 3,
    role: 0,
    description: "Chat with Citti AI without prefix and via replies.",
    category: "chat",
    guide: "{pn} <message> (or just call its name)",
    // প্রিফিক্স ছাড়া কাজ করার জন্য false করা হয়েছে
    usePrefix: false 
  },

  // অনচ্যাট ইভেন্ট প্রিফিক্স ছাড়া মেসেজ ডিটেক্ট করার জন্য
  onChat: async function ({ api, message, event, usersData }) {
    if (!event.body) return;
    const body = event.body.toLowerCase();
    
    const isNickname = nicknames.some(name => body.includes(name));
    const isReplyToBot = event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID();

    // যদি নিকনেম থাকে অথবা বটের মেসেজে সরাসরি রিপ্লাই দেওয়া হয়
    if (isNickname || isReplyToBot) {
      // রিপ্লাইয়ের ক্ষেত্রে নিশ্চিত হওয়া যে এটি এই কমান্ডেরই রিপ্লাই চেইন
      if (isReplyToBot && !global.GoatBot.onReply.has(event.messageReply.messageID)) return;
      
      await handleChat(event.body, message, event, api, usersData, this.config.name);
    }
  },

  // প্রিফিক্স দিয়ে কমান্ড কল করলে (ঐচ্ছিক)
  onStart: async function ({ api, message, args, event, usersData }) {
    const input = args.join(" ").trim();
    
    // সেটিংস চেক (setvoice/list)
    if (input.toLowerCase().startsWith("setvoice") || input.toLowerCase() === "list") {
      return await handleSettings(input, message, event, usersData);
    }

    if (!input) return message.reply("💬 Hello! I am Citti. How can I help you today?");
    await handleChat(input, message, event, api, usersData, this.config.name);
  },

  // বটের মেসেজে রিপ্লাই দিলে এটি কাজ করবে
  onReply: async function ({ api, message, event, Reply, usersData }) {
    // শুধুমাত্র যে ইউজার কথা শুরু করেছে তাকেই রিপ্লাই দিতে দেওয়া (ঐচ্ছিক)
    if (event.senderID !== Reply.author) return;
    await handleChat(event.body, message, event, api, usersData, this.config.name, Reply.session);
  }
};

async function handleChat(input, message, event, api, usersData, commandName, oldSession = null) {
  const userId = event.senderID;
  const session = oldSession || `pi-${userId}`;
  
  api.setMessageReaction("😊", "🌸", "😄", "😩", "🫡", " 😌", "🙂", "😀", "🥳", "😚", "😍", "🥹", "😐", "😕", "💝", "🐱", "💚", "😾", "🦋", "🥺", "🤫", "🌚", "😶", event.messageID, () => {}, true);

  let voiceSetting = await usersData.get(userId, "data.pi_voice") || { voice: false, model: 1 };

  try {
    let res = await callPi(input, session, voiceSetting.voice, voiceSetting.model);
    
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

    const currentCount = await usersData.get(userId, "data.pi_usageCount") || 0;
    await usersData.set(userId, currentCount + 1, "data.pi_usageCount");

    const replyPayload = { body: replyText };
    if (voiceSetting.voice && res.audio) {
      replyPayload.attachment = await global.utils.getStreamFromURL(res.audio);
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    
    return message.reply(replyPayload, (err, info) => {
      if (!err) {
        // রিপ্লাই চেইন বজায় রাখার জন্য ডেটা সেভ করা
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

async function handleSettings(input, message, event, usersData) {
  const userId = event.senderID;
  let voiceSetting = await usersData.get(userId, "data.pi_voice") || { voice: false, model: 1 };

  if (input.toLowerCase().startsWith("setvoice")) {
    const cmd = input.split(" ")[1]?.toLowerCase();
    if (cmd === "on") voiceSetting.voice = true;
    else if (cmd === "off") voiceSetting.voice = false;
    else if (!isNaN(cmd) && piVoiceModels[cmd]) {
      voiceSetting.voice = true;
      voiceSetting.model = parseInt(cmd);
    } else {
      return message.reply("⚙️ Use: setvoice on|off|1-8");
    }
    await usersData.set(userId, voiceSetting, "data.pi_voice");
    return message.reply(`✅ Voice: ${voiceSetting.voice ? "ON" : "OFF"} | Model: ${piVoiceModels[voiceSetting.model]}`);
  }

  if (input.toLowerCase() === "list") {
    const modelList = Object.entries(piVoiceModels).map(([id, name]) => `🔢 ${id} = ${name}`).join("\n");
    return message.reply(`🗂️ Citti Voice Models:\n${modelList}`);
  }
}

async function callPi(query, session, voice = false, model = 1) {
  const addrRes = await axios.get("https://raw.githubusercontent.com/Tanvir0999/stuffs/refs/heads/main/raw/addresses.json");
  let baseUrl = addrRes.data.public;
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  const { data } = await axios.get(`${baseUrl}/pi?query=${encodeURIComponent(query)}&session=${encodeURIComponent(session)}&voice=${voice}&model=${model}`);
  return data.data;
}
