const axios = require('axios');

const piVoiceModels = {
  1: "Pi 1 ✨", 2: "Pi 2 ✨", 3: "Pi 3 ✨", 4: "Pi 4",
  5: "Pi 5", 6: "Pi 6", 7: "Pi 7", 8: "Pi 8"
};

const nicknames = ["bot", "বট", "বেবি", "bby", "baby", "হিনাতা", "hinata", "চিট্টি", "citti"];

module.exports = {
  config: {
    name: "pi",
    version: "2.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Chat with Citti AI using nicknames or direct replies.",
    category: "chat",
    guide: "{pn} <message> or call by name (e.g., Baby, how are you?)"
  },

  onChat: async function ({ api, message, event, usersData, Reply }) {
    const body = event.body ? event.body.toLowerCase() : "";
    const userId = event.senderID;

    // Check if called by nickname or it's a reply to the bot's previous message
    const isNickname = nicknames.some(name => body.includes(name));
    const isReplyToBot = event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID();

    if (isNickname || isReplyToBot) {
      // If it's a reply but NOT to this specific command, stop.
      if (isReplyToBot && event.messageReply.messageID && !global.GoatBot.onReply.has(event.messageReply.messageID)) {
        return;
      }

      await handleChat(body, message, event, usersData, this.config.name);
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    const input = args.join(" ").trim();
    if (!input) return message.reply("💬 Hello! I am Citti. How can I help you today?");
    
    // Command based settings
    if (input.toLowerCase().startsWith("setvoice") || input.toLowerCase() === "list") {
      return await handleSettings(input, message, event, usersData);
    }

    await handleChat(input, message, event, usersData, this.config.name);
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    // Only allow the original author to continue the chain
    if (event.senderID !== Reply.author) return;
    await handleChat(event.body, message, event, usersData, this.config.name, Reply.session);
  }
};

async function handleChat(input, message, event, usersData, commandName, oldSession = null) {
  const userId = event.senderID;
  const session = oldSession || `pi-${userId}`;
  
  message.react("⌛");

  let voiceSetting = await usersData.get(userId, "data.pi_voice") || { voice: false, model: 1 };

  try {
    let res = await callPi(input, session, voiceSetting.voice, voiceSetting.model);
    
    if (!res?.text) {
      message.react("❌");
      return message.reply("❌ Pi did not respond.");
    }

    // --- Filter Logic ---
    let replyText = res.text;
    
    // Identity Filter
    const nameRegex = /Pi AI|Pi|Inflection AI/gi;
    replyText = replyText.replace(nameRegex, "Citti");

    // Developer/Owner Filter
    const creatorRegex = /admin|owner|developer|creator|মালিক|তৈরি করেছে/gi;
    if (creatorRegex.test(input.toLowerCase()) || creatorRegex.test(replyText.toLowerCase())) {
        replyText = "I was created and developed by Lubna Jannat AkHi. She is my master and developer.";
    }

    // Usage count
    const currentCount = await usersData.get(userId, "data.pi_usageCount") || 0;
    await usersData.set(userId, currentCount + 1, "data.pi_usageCount");

    const replyPayload = { body: replyText };
    if (voiceSetting.voice && res.audio) {
      replyPayload.attachment = await global.utils.getStreamFromURL(res.audio);
    }

    message.react("✅");
    return message.reply(replyPayload, (err, info) => {
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
    message.react("❌");
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
