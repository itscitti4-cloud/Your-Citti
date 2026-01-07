const axios = require("axios");
const fs = require("fs"); 
const Canvas = require("canvas"); 

module.exports = {
  config: {
    name: "developer info",
    aliases: ["devinfo", "dinfo"],
    version: "1.0",
    role: 0,
    author: "The Nawab",
    Description: "Get user information with local canvas image",
    category: "information",
    countDown: 5,
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
      const imagePath = __dirname + "/assets/image/IMG_20251121_163554.jpg";
      
      // ফাইলটি সিস্টেমে আছে কি না চেক করে স্ট্রিম তৈরি করা
      const imageStream = fs.createReadStream(imagePath);

      const userInformation = `
╭────[ BOT DEVELOPER INFO ]
├‣ 𝙽𝚊𝚖𝚎: 𝚂𝙷𝙰𝙷𝚁𝚈𝙰𝚁 𝚂𝙰𝙱𝚄
├‣ 𝙶𝚎𝚗𝚍𝚎𝚛: 𝙼𝚊𝚕𝚎
├‣ 𝚄𝙸𝙳: 61585634146171
├‣ 𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎: 𝚜𝚑𝚊𝚑𝚛𝚢𝚊𝚛𝚜𝚊𝚋𝚞.𝚗𝚊𝚠𝚊𝚋
├‣ FB: 𝚏𝚋.𝚌𝚘𝚖/𝚜𝚑𝚊𝚑𝚛𝚢𝚊𝚛𝚜𝚊𝚋𝚞.𝚗𝚊𝚠𝚊𝚋
├‣ 𝙱𝚒𝚛𝚝𝚑𝚍𝚊𝚢: 30 𝙼𝚊𝚢.
├‣ 𝙽𝚒𝚌𝚔𝙽𝚊𝚖𝚎: 𝙽𝙰𝚆𝙰𝙱
├‣ 𝚂𝚝𝚊𝚝𝚞𝚜: 𝙼𝚊𝚛𝚛𝚒𝚎𝚍
├‣ 𝚆𝚒𝚏𝚎: 𝙻𝚞𝚋𝚗𝚊 𝙹𝚊𝚗𝚗𝚊𝚝 𝙰𝚔𝙷𝚒
├‣ 𝚆𝚎𝚎𝚍𝚒𝚗𝚐 𝙳𝚊𝚝𝚎: 20 𝙵𝚎𝚋𝚛𝚞𝚊𝚛𝚢, 2025
├‣ 𝙿𝚛𝚘𝚏𝚎𝚜𝚜𝚒𝚘𝚗 : 𝙴𝚕𝚎𝚌𝚝𝚛𝚒𝚌𝚒𝚊𝚗
├‣ 𝙻𝚒𝚟𝚎𝚜 𝚒𝚗 : 𝙻𝚊𝚕𝚋𝚊𝚐𝚑, 𝙳𝚑𝚊𝚔𝚊
╰‣ 𝙵𝚛𝚘𝚖 : 𝙱𝚑𝚊𝚗𝚍𝚊𝚛𝚒𝚊, 𝙿𝚒𝚛𝚘𝚓𝚙𝚞𝚛, 𝙱𝚊𝚛𝚒𝚜𝚑𝚊𝚕`;

      return api.sendMessage({
        body: userInformation,
        attachment: imageStream,
      }, event.threadID, event.messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("Image File Not found", event.threadID);
    }
  },
};
