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
╭──[ BOT DEVELOPER INFO ]──╮
├‣ Name: SHAHRYAR SABU
├‣ Gender: Male
├‣ UID: 61586632438983
├‣ Username: nawab.shahryarsabu
├‣ FB: fb.com/nawab.shahryarsabu
├‣ IG: ig.com/shahryar.sabu
├‣ WA: +8801607-533743
├‣ WA: +8801607-533744
├‣ Birthday: 30 May
├‣ Nickname: Nawab
├‣ Status: Married
├‣ Wife: Lubna Jannat
├‣ Weeding date: 20 February, 2025
├‣ Profession: Electrician
├‣ Lives in: Lalbagh, Dhaka 
╰‣ From: Bhandaria, Pirojpur, Barishal.`;

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
