const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cron = require("node-cron");
const moment = require("moment-timezone");
const jimp = require("jimp");

function formatCurrency(number) {
    if (number === undefined || number === null || isNaN(number)) return "0";
    if (number < 1000) return number.toString();
    const units = ["", "K", "M", "B", "T"];
    const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
    const suffix = units[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;
    return scaled.toFixed(1).replace(/\.0$/, "") + suffix;
}

function getAge(dob) {
    const birthDate = moment(dob, "DD-MM-YYYY");
    const today = moment.tz("Asia/Dhaka");
    return today.diff(birthDate, 'years');
}

module.exports = {
  config: {
    name: "birthday",
    aliases: ["dob"],
    version: "3.6.9",
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

  onStart: async function ({ api, event, args, usersData, currenciesData, Currencies }) { 
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const action = args[0]?.toLowerCase();
    const cost = 10000;
    
    // Currencies অবজেক্টটি ঠিক করা
    const currencySystem = currenciesData || Currencies;

    const adminIDs = global.config?.ADMINBOT || global.config?.adminIDs || [];
    const developerID = global.config?.NDH || global.config?.developerID || "";
    
    const isAdmin = Array.isArray(adminIDs) ? adminIDs.some(id => (id.id || id) == senderID) : adminIDs == senderID;
    const isDev = developerID == senderID;
    const user = await usersData.get(senderID);
    const isVIP = user.data?.isVIP || false;
    const isFree = isAdmin || isDev || isVIP;

    if (action === "add" || action === "set") {
      if (!isFree) {
        if (!currencySystem) return api.sendMessage("❌ Money system is not available in this bot.", threadID, messageID);
        const userData = await currencySystem.get(senderID);
        if (!userData || userData.money < cost) {
          return api.sendMessage(`❌ You don't have enough balance. This command costs ${formatCurrency(cost)}.`, threadID, messageID);
        }
      }

      if (action === "add") {
        let uid, dob;
        if (messageReply) { uid = messageReply.senderID; dob = args[1]; }
        else if (Object.keys(mentions).length > 0) { uid = Object.keys(mentions)[0]; dob = args[args.length - 1]; }
        else { uid = senderID; dob = args[1]; }

        if (!dob || !/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
            return api.sendMessage("⚠️ Incorrect Date Format!\n💡 Please use: DD-MM-YYYY\nExample: 31-12-2001", threadID, messageID);
        }
        
        if (!isFree) await currencySystem.decreaseMoney(senderID, cost);
        
        const currentData = (await usersData.get(uid)).data || {};
        currentData.birthday = dob;
        await usersData.set(uid, currentData, "data");

        let msg = `✅ Birthday successfully set for ${uid} on ${dob}`;
        if (!isFree) msg += `\n💸 ${formatCurrency(cost)} has been deducted from your balance.`;
        return api.sendMessage(msg, threadID, messageID);
      }

      if (action === "set") {
        let uid, wishText;
        if (messageReply) { uid = messageReply.senderID; wishText = args.slice(1).join(" "); }
        else if (Object.keys(mentions).length > 0) { uid = Object.keys(mentions)[0]; wishText = args.slice(2).join(" "); }
        else { uid = senderID; wishText = args.slice(1).join(" "); }

        if (!uid || !wishText) return api.sendMessage("❌ Usage: !dob set <text>", threadID, messageID);
        
        if (!isFree) await currencySystem.decreaseMoney(senderID, cost);
        
        const currentData = (await usersData.get(uid)).data || {};
        currentData.customWish = wishText;
        await usersData.set(uid, currentData, "data");

        let msg = "✅ Custom wish format updated!";
        if (!isFree) msg += `\n💸 ${formatCurrency(cost)} has been deducted from your balance.`;
        return api.sendMessage(msg, threadID, messageID);
      }
    }

    if (action === "list") {
      const allUsers = (await usersData.getAll()).filter(u => u.data?.birthday);
      if (allUsers.length === 0) return api.sendMessage("The birthday list is empty.", threadID);
      
      let msg = "🎂 BIRTHDAY LIST 🎂\n━━━━━━━━━━━━━━\n";
      allUsers.forEach((u, i) => msg += `${i + 1}. ${u.name} (${u.data.birthday})\n`);
      msg += "\n💬 Reply with a number to see a sample wish.";
      
      return api.sendMessage(msg, threadID, (err, info) => {
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "view_sample",
          list: allUsers
        });
      }, messageID);
    }

    if (action === "upcoming") {
        const allUsers = await usersData.getAll();
        const upcoming = [];
        const today = moment.tz("Asia/Dhaka");
        for (let i = 1; i <= 7; i++) {
          const nextDay = today.clone().add(i, 'days').format("DD-MM");
          allUsers.forEach(u => {
            if (u.data?.birthday && u.data.birthday.startsWith(nextDay)) {
              upcoming.push({ name: u.name, date: u.data.birthday.substring(0, 5) });
            }
          });
        }
        let msg = "📅 UPCOMING BIRTHDAYS (Next 7 Days) 📅\n━━━━━━━━━━━━━━\n";
        if (upcoming.length === 0) msg += "No birthdays in the next 7 days.";
        else upcoming.forEach(u => msg += `• ${u.name} - ${u.date}\n`);
        return api.sendMessage(msg, threadID, messageID);
    }

    if (action === "rem" || action === "remove") {
        let uid;
        if (messageReply) { uid = messageReply.senderID; }
        else if (Object.keys(mentions).length > 0) { uid = Object.keys(mentions)[0]; }
        else if (args[1]) { uid = args[1]; }
        else { uid = senderID; }

        const userData = await usersData.get(uid);
        const currentData = userData.data || {};
        currentData.birthday = null;
        currentData.customWish = null;
        await usersData.set(uid, currentData, "data");
        return api.sendMessage(`✅ Birthday record removed successfully for ${uid}.`, threadID, messageID);
    }

    if (action === "check") {
        await this.checkAndWish({ api, usersData, targetThreadID: threadID });
        return api.sendMessage("🔍 Scan complete.", threadID);
    }
  }
};
        
