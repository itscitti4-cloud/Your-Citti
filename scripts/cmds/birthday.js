const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cron = require("node-cron");

// Function to format money (K, M, B, T)
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

module.exports = {
  config: {
    name: "birthday",
    aliases: ["dob"],
    version: "2.0.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Manage birthdays with MongoDB support",
    longDescription: "Add birthdays. VIPs are free, others pay $10,000.",
    category: "utility",
    guide: "{pn} add [tag/reply/uid] DD-MM-YYYY\n{pn} rem [tag/reply/uid]\n{pn} list"
  },

  onLoad: async function ({ api, usersData }) {
    // প্রতিদিন রাত ১২টায় উইশ করার জন্য ক্রন জব
    cron.schedule("0 0 * * *", async () => {
      const allUsers = await usersData.getAll();
      const today = new Date();
      const dayMonth = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      
      for (const user of allUsers) {
        if (user.data && user.data.birthday && user.data.birthday.startsWith(dayMonth)) {
          const name = user.name;
          const uid = user.userID;
          const msg = `🎊 HAPPY BIRTHDAY 🎊\n━━━━━━━━━━━━━━\n✨ Wishing a wonderful day to: ${name}\n🎂 May all your dreams come true!\n━━━━━━━━━━━━━━\n💖 Enjoy your special day!`;
          
          const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
          const imgPath = path.join(cacheDir, `bd_${uid}.png`);

          try {
            const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(imgPath, Buffer.from(res.data));
            for (const thread of threads) {
              if (thread.isGroup) {
                api.sendMessage({ body: msg, attachment: fs.createReadStream(imgPath) }, thread.threadID);
              }
            }
          } catch (e) {
            for (const thread of threads) {
              if (thread.isGroup) api.sendMessage(msg, thread.threadID);
            }
          }
        }
      }
    }, { timezone: "Asia/Dhaka" });
  },

  onStart: async function ({ api, event, args, usersData }) { 
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const cost = 10000;
    const action = args[0]?.toLowerCase();

    if (action === "add") {
      let uid, dob;
      if (messageReply) {
        uid = messageReply.senderID;
        dob = args[1];
      } else if (Object.keys(mentions).length > 0) {
        uid = Object.keys(mentions)[0];
        dob = args[args.length - 1];
      } else if (args.length === 3 && !isNaN(args[1])) {
        uid = args[1];
        dob = args[2];
      } else {
        uid = senderID;
        dob = args[1];
      }

      if (!dob || !/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
        return api.sendMessage("❌ Invalid format! Use: DD-MM-YYYY (Example: 30-12-2000)", threadID, messageID);
      }

      try {
        const senderInfo = await usersData.get(senderID);
        const isVip = (senderInfo.data && senderInfo.data.isVip === true);

        // টাকা কাটার লজিক (নরমাল ইউজারদের জন্য)
        if (!isVip) {
          if (senderInfo.money < cost) {
            return api.sendMessage(`❌ You need $${formatCurrency(cost)} to add a birthday. VIP users can add for free!`, threadID, messageID);
          }
          await usersData.set(senderID, { money: senderInfo.money - cost });
        }

        const info = await api.getUserInfo(uid);
        const name = info[uid].name; 
        
        // MongoDB-তে ডাটা সেভ করা (data অবজেক্টের ভেতরে birthday কি-তে)
        await usersData.set(uid, { birthday: dob }, "data");
        
        let successMsg = `✅ Success! Birthday for ${name} set to ${dob}\n`;
        successMsg += isVip ? `✨ VIP Benefit: Added for free!` : `💰 Fee Paid: $${formatCurrency(cost)}`;
        
        return api.sendMessage(successMsg, threadID, messageID);
      } catch (err) {
        return api.sendMessage("❌ Error while processing. Please try again.", threadID, messageID);
      }
    }

    if (action === "rem" || action === "remove") {
      let uid = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || args[1] || senderID);
      
      const userData = await usersData.get(uid);
      if (!userData.data || !userData.data.birthday) {
        return api.sendMessage("❌ No birthday record found for this user in DB.", threadID, messageID);
      }
      
      // MongoDB থেকে ডাটা রিমুভ করা
      await usersData.set(uid, { birthday: null }, "data");
      return api.sendMessage("✅ Removed successfully from Database.", threadID, messageID);
    }

    if (action === "list") {
      const allUsers = await usersData.getAll();
      const bdayList = allUsers.filter(u => u.data && u.data.birthday);
      
      let msg = "🎂 BIRTHDAY LIST (DB) 🎂\n━━━━━━━━━━━━━━\n";
      if (bdayList.length === 0) msg += "No birthdays recorded in the database.";
      else {
        bdayList.forEach((user, index) => {
          msg += `${index + 1}. ${user.name} - ${user.data.birthday}\n`;
        });
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    return api.sendMessage("❓ Use: !dob [add | rem | list]", threadID, messageID);
  }
};
