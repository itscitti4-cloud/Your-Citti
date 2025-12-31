const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cron = require("node-cron");
const moment = require("moment-timezone");
const jimp = require("jimp");

// অপ্রয়োজনীয় formatCurrency ফাংশনটি সরিয়ে ফেলা হয়েছে

function getAge(dob) {
    const birthDate = moment(dob, "DD-MM-YYYY");
    const today = moment.tz("Asia/Dhaka");
    return today.diff(birthDate, 'years');
}

module.exports = {
  config: {
    name: "birthday",
    aliases: ["dob"],
    version: "3.7.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Manage birthdays with automatic wishing",
    category: "utility",
    guide: "{pn} add [tag/reply/uid] DD-MM-YYYY\n{pn} set [tag/reply/uid/list#] <message>\n{pn} rem [tag/reply/uid/list#]\n{pn} list\n{pn} upcoming\n{pn} check"
  },

  onLoad: async function ({ api, usersData }) {
    cron.schedule("1 0 * * *", async () => {
      await this.checkAndWish({ api, usersData });
    }, { timezone: "Asia/Dhaka" });
  },

  checkAndWish: async function ({ api, usersData, targetThreadID = null }) {
    const allUsers = await usersData.getAll();
    const today = moment.tz("Asia/Dhaka").format("DD-MM");
    const threads = targetThreadID ? [{ threadID: targetThreadID }] : await api.getThreadList(100, null, ["INBOX"]);
    
    for (const user of allUsers) {
      if (user.data && user.data.birthday && user.data.birthday.startsWith(today)) {
        const { name, userID: uid } = user;
        const age = getAge(user.data.birthday);
        
        let customMsg = user.data.customWish || `✨ Wishing a wonderful day to: ${name}\n🎂 May all your dreams come true!`;
        customMsg = customMsg.replace(/{name}/g, name).replace(/{age}/g, age);
        
        const msg = `🎊 HAPPY BIRTHDAY 🎊\n━━━━━━━━━━━━━━\n${customMsg}\n━━━━━━━━━━━━━━\n💖 Enjoy your special day!`;
        
        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const frameUrl = "https://i.imgur.com/vSgOonU.png"; 
        
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        const imgPath = path.join(cacheDir, `bd_frame_${uid}.png`);

        try {
          const [frame, avatar] = await Promise.all([
            jimp.read(frameUrl),
            jimp.read(avatarUrl)
          ]);
          
          avatar.resize(320, 320).circle(); 
          frame.resize(500, 500);
          frame.composite(avatar, 90, 75); 
          
          await frame.writeAsync(imgPath);

          for (const thread of threads) {
            if (targetThreadID || thread.isGroup) {
              api.sendMessage({ body: msg, attachment: fs.createReadStream(imgPath) }, thread.threadID);
            }
          }
        } catch (e) {
          for (const thread of threads) {
            if (targetThreadID || thread.isGroup) api.sendMessage(msg, thread.threadID);
          }
        }
      }
    }
  },

  onReply: async function ({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    if (handleReply.author != senderID) return;

    if (handleReply.type === "view_sample") {
      const num = parseInt(body);
      const list = handleReply.list;
      if (isNaN(num) || num > list.length || num <= 0) return api.sendMessage("❌ Invalid number!", threadID, messageID);
      
      const targetUser = list[num - 1];
      const age = getAge(targetUser.data.birthday);
      
      let customMsg = targetUser.data.customWish || `✨ Wishing a wonderful day to: ${targetUser.name}\n🎂 May all your dreams come true!`;
      customMsg = customMsg.replace(/{name}/g, targetUser.name).replace(/{age}/g, age);
      
      const msg = `🎁 [SAMPLE WISH]\n━━━━━━━━━━━━━━\n🎊 HAPPY BIRTHDAY 🎊\n━━━━━━━━━━━━━━\n${customMsg}\n━━━━━━━━━━━━━━`;
      
      return api.sendMessage(msg, threadID, messageID);
    }
  },

  onStart: async function ({ api, event, args, usersData }) { 
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const action = args[0]?.toLowerCase();

    if (action === "add") {
      let uid, dob;
      if (messageReply) { uid = messageReply.senderID; dob = args[1]; }
      else if (Object.keys(mentions).length > 0) { uid = Object.keys(mentions)[0]; dob = args[args.length - 1]; }
      else { uid = senderID; dob = args[1]; }

      if (!dob || !/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
          return api.sendMessage("⚠️ Incorrect Date Format!\n💡 Please use: DD-MM-YYYY\nExample: 31-12-2001", threadID, messageID);
      }
      
      const currentData = (await usersData.get(uid)).data || {};
      currentData.birthday = dob;
        
