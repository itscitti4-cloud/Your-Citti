const axios = require("axios");
const fs = require("fs"); 
const Canvas = require("canvas"); 

module.exports = {
  config: {
    name: "admininfo",
    aliases: ["adinfo", "adminke"],
    version: "1.0",
    role: 0,
    author: "AkHi",
    Description: "Get user information with local canvas image",
    category: "information",
    countDown: 10,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions)[0];
    let uid;

    if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) {
          uid = match[1];
        }
      }
    }

    if (!uid) {
      uid = event.type === "message_reply" ? event.messageReply.senderID : uid2 || uid1;
    }

    try {
      // আপনার নির্দিষ্ট করা ক্যানভাস ইমেজ পাথ
      const imagePath = __dirname + "/assets/image/Picsart_25-12-16_05-40-59-008.jpg";
      
      // ফাইলটি সিস্টেমে আছে কি না চেক করে স্ট্রিম তৈরি করা
      const imageStream = fs.createReadStream(imagePath);

      const userInformation = `
╭────[ BOT ADMIN INFO ]
├‣ 𝙽𝚊𝚖𝚎: 𝙻𝚄𝙱𝙽𝙰 𝙹𝙰𝙽𝙽𝙰𝚃
├‣ 𝙶𝚎𝚗𝚍𝚎𝚛: 𝙵𝙴𝙼𝙰𝙻𝙴
├‣ 𝚄𝙸𝙳: 61583939430347
├‣ 𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎: 𝙻𝚞𝚋𝚗𝚊𝚊𝙹𝚊𝚗𝚗𝚊𝚝.𝙰𝚔𝙷𝚒
├‣ 𝙵𝙱: 𝚏𝚋.𝚌𝚘𝚖/𝙻𝚞𝚋𝚗𝚊𝚊𝙹𝚊𝚗𝚗𝚊𝚝.𝙰𝚔𝙷𝚒
├‣ 𝙸𝙶: @𝚕𝚞𝚋𝚗𝚊𝚓𝚊𝚗𝚗𝚊𝚝_
├‣ 𝙱𝚒𝚛𝚝𝚑𝚍𝚊𝚢: 27 𝙾𝚌𝚝𝚘𝚋𝚎𝚛
├‣ 𝙽𝚒𝚌𝚔𝙽𝚊𝚖𝚎: 𝙰𝚔𝙷𝚒
├‣ 𝚂𝚝𝚊𝚝𝚞𝚜: 𝙼𝚊𝚛𝚛𝚒𝚎𝚍
├‣ 𝙷𝚞𝚜𝚋𝚊𝚗𝚍: 𝚂𝚑𝚊𝚑𝚛𝚢𝚊𝚛 𝚂𝚊𝚋𝚞
├‣ 𝚆𝚎𝚎𝚍𝚒𝚗𝚐: 20 𝙵𝚎𝚋𝚛𝚞𝚊𝚛𝚢, 2025
├‣ 𝙿𝚛𝚘𝚏𝚎𝚜𝚜𝚒𝚘𝚗: 𝚃𝚎𝚊𝚌𝚑𝚎𝚛
├‣ 𝚂𝚝𝚞𝚍𝚢: 𝙱𝙱𝙰 𝙷𝚘𝚗𝚘𝚞𝚛𝚜
├‣ 𝙸𝚗𝚜𝚝𝚒𝚝𝚞𝚝𝚎: 𝚄𝚗𝚒𝚟𝚎𝚛𝚜𝚒𝚝𝚢 𝚘𝚏 𝙳𝚑𝚊𝚔𝚊
├‣ 𝙻𝚒𝚟𝚎𝚜 𝚒𝚗: 𝙻𝚊𝚕𝚋𝚊𝚐𝚑, 𝙳𝚑𝚊𝚔𝚊
╰‣ 𝙵𝚛𝚘𝚖 : 𝙱𝚑𝚊𝚗𝚍𝚊𝚛𝚒𝚊, 𝙿𝚒𝚛𝚘𝚓𝚙𝚞𝚛, 𝙱𝚊𝚛𝚒𝚜𝚑𝚊𝚕`;

      return api.sendMessage({
        body: userInformation,
        attachment: imageStream,
      }, event.threadID, event.messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("Image file not found", event.threadID);
    }
  },
};
