const axios = require("axios");
const fs = require("fs"); 
const Canvas = require("canvas"); 

module.exports = {
  config: {
    name: "Lubna",
    alias: ["akhi"],
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
├‣ 𝙽𝚊𝚖𝚎: Lubna Jannat
├‣ 𝙶𝚎𝚗𝚍𝚎𝚛: Female
├‣ 𝚄𝙸𝙳: 61583939430347
├‣ 𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎: LubnaaJannat.AkHi
├‣ FB: facebook.com/LubnaaJannat.AkHi
├‣ 𝙱𝚒𝚛𝚝𝚑𝚍𝚊𝚢: 27 October
├‣ 𝙽𝚒𝚌𝚔𝙽𝚊𝚖𝚎: AkHi
├‣ Status: Married
├‣ Husband: Shahryar Sabu
├‣ Weeding date: 20 February, 2025
├‣ Profession: Teacher
├‣ Study: BBA Honours 
├‣ Institute: University of Dhaka
├‣ Lives in : Lalbagh, Dhaka
╰‣ From : Bhandaria, Pirojpur, Barishal`;

      return api.sendMessage({
        body: userInformation,
        attachment: imageStream,
      }, event.threadID, event.messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("ইমেজ ফাইলটি খুঁজে পাওয়া যায়নি বা কোনো ত্রুটি হয়েছে।", event.threadID);
    }
  },
};
