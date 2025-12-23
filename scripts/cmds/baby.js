const axios = require("axios");

const mahmud = [
  "baby", "bby", "babu", "bbu", "jan", "bot", "জান", "জানু", "বেবি", "wifey", "hinata"
];

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports.config = {
  name: "hinata",
  aliases: ["baby", "bby", "bbu", "jan", "janu", "wifey", "bot"],
  version: "1.8",
  author: "AkHi",
  role: 0,
  category: "chat",
  guide: {
    en: "{pn} [message] OR teach [question] - [response1, response2,...] OR remove [question] - [index] OR list OR list all OR edit [question] - [newResponse] OR msg [question]\nNote: All-in-one Simi Chat updated by AkHi."
  }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
  const msg = args.join(" ").toLowerCase();
  const uid = event.senderID;
  const tid = event.threadID;
  const allowedThreadID = "25416434654648555"; // আপনার দেওয়া নির্দিষ্ট গ্রুপ আইডি

  try {
    if (!args[0]) {
      const ran = ["Bolo baby", "I love you", "type !bby hi"];
      return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], tid, event.messageID);
    }

    // Teach Command - Group Restricted
    if (args[0] === "teach") {
      if (tid !== allowedThreadID) {
        return api.sendMessage("❌ এই কমান্ডটি শুধুমাত্র নির্দিষ্ট সাপোর্ট গ্রুপে ব্যবহারের জন্য অনুমোদিত।", tid, event.messageID);
      }
      const content = msg.replace("teach ", "");
      const [trigger, ...responsesArr] = content.split(" - ");
      const responses = responsesArr.join(" - ");
      if (!trigger || !responses) return api.sendMessage("❌ | teach [question] - [response1, response2,...]", tid, event.messageID);
      
      const response = await axios.post(`${await baseApiUrl()}/api/jan/teach`, { trigger, responses, userID: uid });
      const userName = (await usersData.getName(uid)) || "Unknown User";
      return api.sendMessage(`✅ Replies added: "${responses}" to "${trigger}"\n• 𝐓𝐞𝐚𝐜𝐡𝐞𝐫: ${userName}\n• 𝐓𝐨𝐭𝐚𝐥: ${response.data.count || 0}`, tid, event.messageID);
    }

    if (args[0] === "remove") {
      const content = msg.replace("remove ", "");
      const [trigger, index] = content.split(" - ");
      if (!trigger || !index || isNaN(index)) return api.sendMessage("❌ | remove [question] - [index]", tid, event.messageID);
      const response = await axios.delete(`${await baseApiUrl()}/api/jan/remove`, { data: { trigger, index: parseInt(index, 10) } });
      return api.sendMessage(response.data.message, tid, event.messageID);
    }

    if (args[0] === "list") {
      const endpoint = args[1] === "all" ? "/list/all" : "/list";
      const response = await axios.get(`${await baseApiUrl()}/api/jan${endpoint}`);
      if (args[1] === "all") {
        let message = "👑 List of Hinata teachers:\n\n";
        const data = Object.entries(response.data.data).sort((a, b) => b[1] - a[1]).slice(0, 15);
        for (let i = 0; i < data.length; i++) {
          const [userID, count] = data[i];
          const name = (await usersData.getName(userID)) || "Unknown";
          message += `${i + 1}. ${name}: ${count}\n`;
        }
        return api.sendMessage(message, tid, event.messageID);
      }
      return api.sendMessage(response.data.message, tid, event.messageID);
    }

    if (args[0] === "edit") {
      const content = msg.replace("edit ", "");
      const [oldTrigger, ...newArr] = content.split(" - ");
      const newResponse = newArr.join(" - ");
      if (!oldTrigger || !newResponse) return api.sendMessage("❌ | Format: edit [question] - [newResponse]", tid, event.messageID);
      await axios.put(`${await baseApiUrl()}/api/jan/edit`, { oldTrigger, newResponse });
      return api.sendMessage(`✅ Edited "${oldTrigger}" to "${newResponse}"`, tid, event.messageID);
    }

    if (args[0] === "msg") {
      const searchTrigger = args.slice(1).join(" ");
      if (!searchTrigger) return api.sendMessage("Please provide a message to search.", tid, event.messageID);
      try {
        const response = await axios.get(`${await baseApiUrl()}/api/jan/msg`, { params: { userMessage: `msg ${searchTrigger}` } });
        return api.sendMessage(response.data.message || "No message found.", tid, event.messageID);
      } catch (error) {
        return api.sendMessage("Error fetching message.", tid, event.messageID);
      }
    }

    // Default Chat Response
    const getBotResponse = async (text, attachments) => {
      try {
        const res = await axios.post(`${await baseApiUrl()}/api/hinata`, { text, style: 3, attachments });
        return res.data.message;
      } catch { return "error janu🥹"; }
    };
    const botResponse = await getBotResponse(msg, event.attachments || []);
    api.sendMessage(botResponse, tid, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "citti",
          type: "reply",
          messageID: info.messageID,
          author: uid,
          text: botResponse
        });
      }
    }, event.messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage(`${err.message}`, tid, event.messageID);
  }
};

module.exports.onReply = async ({ api, event }) => {
  if (event.type !== "message_reply") return;
  try {
    const getBotResponse = async (text, attachments) => {
      try {
        const res = await axios.post(`${await baseApiUrl()}/api/hinata`, { text, style: 3, attachments });
        return res.data.message;
      } catch { return "error janu🥹"; }
    };
    const replyMessage = await getBotResponse(event.body?.toLowerCase() || "meow", event.attachments || []);
    api.sendMessage(replyMessage, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "citti",
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          text: replyMessage
        });
      }
    }, event.messageID);
  } catch (err) { console.error(err); }
};

module.exports.onChat = async ({ api, event }) => {
  try {
    const message = event.body?.toLowerCase() || "";
    const attachments = event.attachments || [];
    if (event.type !== "message_reply" && mahmud.some(word => message.startsWith(word))) {
      api.setMessageReaction("🪽", event.messageID, () => {}, true);
      const randomMessage = [
        "babu khuda lagse🥺", "Hop beda😾,Boss বল boss😼", "আমাকে ডাকলে ,আমি কিন্তূ কিস করে দেবো😘 ", "🐒🐒🐒", "bye", "meww", "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘", "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏", "গোসল করে আসো যাও😑😩", "অ্যাসলামওয়ালিকুম", "কেমন আসো", "বলেন sir__😌", "বলেন ম্যাডাম__😌", "আমি অন্যের জিনিসের সাথে কথা বলি না__😏ওকে", "🙂🙂🙂", "𝗕𝗯𝘆 𝗯𝗼𝗹𝗹𝗮 𝗽𝗮𝗽 𝗵𝗼𝗶𝗯𝗼 😒😒", "𝗧𝗮𝗿𝗽𝗼𝗿 𝗯𝗼𝗹𝗼_🙂", "𝗕𝗲𝘀𝗵𝗶 𝗱𝗮𝗸𝗹𝗲 𝗮𝗺𝗺𝘂 𝗯𝗼𝗸𝗮 𝗱𝗲𝗯𝗮 𝘁𝗼__🥺", "𝗕𝗯𝘆 না জানু, বল 😌", "বেশি bby Bbby করলে leave নিবো কিন্তু 😒😒", "__বেশি বেবি বললে কামুর দিমু 🤭🤭", "𝙏𝙪𝙢𝙖𝙧 𝙜𝙛 𝙣𝙖𝙞, 𝙩𝙖𝙮 𝙖𝙢𝙠 𝙙𝙖𝙠𝙨𝙤? 😂😂😂", "bolo baby😒", "আমি তো অন্ধ কিছু দেখি না🐸 😎", "আম গাছে আম নাই ঢিল কেন মারো, তোমার সাথে প্রেম নাই বেবি কেন ডাকো 😒🫣", "𝗕𝗯𝘆 না বলে 𝗕𝗼𝘄 বলো 😘", "আজব তো__😒", "আমাকে ডেকো না,আমি ব্যাস্ত আসি🙆🏻‍♀", "খাওয়া দাওয়া করসো 🙄", "এত কাছেও এসো না,প্রেম এ পরে যাবো তো 🙈", "আরে Bolo আমার জান, কেমন আসো? 😚", "oi mama ar dakis na pilis 😿", "🐤🐤", "__ভালো হয়ে  যাও 😑😒", "বলো ফুলটুশি_😘", "বলো জানু 😒", "Meow🐤", "কি হলো, মিস টিস করচ্ছো নাকি 🤣", "Bolo Babu, তুমি কি আমাকে ভালোবাসো? 🙈"
      ];
      const hinataMessage = randomMessage[Math.floor(Math.random() * randomMessage.length)];
      if (message.split(/\s+/).length === 1 && attachments.length === 0) {
        api.sendMessage(hinataMessage, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "hinata",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              text: hinataMessage
            });
          }
        }, event.messageID);
      } else {
        let userText = message;
        for (const prefix of mahmud) { if (message.startsWith(prefix)) { userText = message.substring(prefix.length).trim(); break; } }
        const getBotResponse = async (text, attachments) => {
          try {
            const res = await axios.post(`${await baseApiUrl()}/api/hinata`, { text, style: 3, attachments });
            return res.data.message;
          } catch { return "error janu🥹"; }
        };
        const botResponse = await getBotResponse(userText, attachments);
        api.sendMessage(botResponse, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "hinata",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              text: botResponse
            });
          }
        }, event.messageID);
      }
    }
  } catch (err) { console.error(err); }
};
          
