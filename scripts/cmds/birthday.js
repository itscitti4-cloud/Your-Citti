const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cron = require("node-cron");

const dbPath = path.join(__dirname, "../../birthdays.json");

module.exports = {
  config: {
    name: "birthday",
    aliases: ["dob"],
    version: "1.3.2",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Manage birthdays",
    longDescription: "Add, remove, or list birthdays with auto-wish feature.",
    category: "utility",
    guide: "{pn} add [tag/reply/uid] DD-MM-YYYY\n{pn} rem [tag/reply/uid]\n{pn} list"
  },

  onLoad: async function ({ api }) {
    if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, {});

    cron.schedule("0 0 * * *", async () => {
      const birthdays = fs.readJsonSync(dbPath);
      const today = new Date();
      const dayMonth = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      
      for (const uid in birthdays) {
        if (birthdays[uid].date.startsWith(dayMonth)) {
          const name = birthdays[uid].name;
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

  onStart: async function ({ api, event, args }) { 
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, {});
    let birthdays = fs.readJsonSync(dbPath);

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
        // সরাসরি API থেকে নাম নেওয়ার পদ্ধতি (সবচেয়ে নিরাপদ)
        const info = await api.getUserInfo(uid);
        const name = info[uid].name; 
        
        birthdays[uid] = { name, date: dob };
        fs.writeJsonSync(dbPath, birthdays);
        return api.sendMessage(`✅ Success! Added birthday for ${name} on ${dob}`, threadID, messageID);
      } catch (err) {
        return api.sendMessage("❌ Could not fetch user information. Make sure UID is correct.", threadID, messageID);
      }
    }

    if (action === "rem" || action === "remove") {
      let uid = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || args[1] || senderID);
      if (!birthdays[uid]) return api.sendMessage("❌ No birthday found for this user.", threadID, messageID);
      
      delete birthdays[uid];
      fs.writeJsonSync(dbPath, birthdays);
      return api.sendMessage("✅ Removed successfully.", threadID, messageID);
    }

    if (action === "list") {
      let msg = "🎂 BIRTHDAY LIST 🎂\n━━━━━━━━━━━━━━\n";
      const entries = Object.entries(birthdays);
      if (entries.length === 0) msg += "Empty.";
      else {
        entries.forEach(([uid, data], index) => {
          msg += `${index + 1}. ${data.name} - ${data.date}\n`;
        });
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    return api.sendMessage("❓ Use: !dob [add | rem | list]", threadID, messageID);
  }
};
