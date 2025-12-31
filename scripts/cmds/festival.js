const cron = require("node-cron");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

let scheduledTask = null;

module.exports = {
  config: {
    name: "festival",
    aliases: ["fstvl"],
    version: "1.5.0",
    author: "AkHi",
    countDown: 5,
    role: 1,
    shortDescription: "Manage global event wishing with local image",
    category: "utility",
    guide: "{pn} text <your message>\n{pn} set DD-MM-YYYY HH:mmAM/PM\n{pn} reset\n{pn} check\n{pn} replace <filename.jpg>"
  },

  onLoad: async function ({ api }) {
    const cacheDir = path.join(__dirname, "cache");
    const jsonPath = path.join(cacheDir, "newyear_global.json");

    const setupCron = (cronTime) => {
      if (scheduledTask) scheduledTask.stop();
      scheduledTask = cron.schedule(cronTime, async () => {
        const allThreads = await api.getThreadList(500, null, ["INBOX"]);
        const localImgPath = path.join(__dirname, "assets", "image", "golden-happy-new-year-2026-celebration-with-clock-fireworks_783182-823.jpg");
        
        let globalData = {};
        if (fs.existsSync(jsonPath)) globalData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

        const finalMsg = globalData.message || `🎊 HAPPY NEW YEAR 2026 🎊\n━━━━━━━━━━━━━━\n🌟 Goodbye 2025, Welcome 2026! 🌟\n\nMay the new year bring endless joy, peace, and success to your life. ✨\n━━━━━━━━━━━━━━\n💖 Wish you a great year ahead!`;

        for (const thread of allThreads) {
          if (thread.isGroup && thread.isSubscribed) {
            try {
              const sendData = fs.existsSync(localImgPath) 
                ? { body: finalMsg, attachment: fs.createReadStream(localImgPath) }
                : { body: finalMsg };
              await api.sendMessage(sendData, thread.threadID);
            } catch (e) { continue; }
          }
        }
      }, { scheduled: true, timezone: "Asia/Dhaka" });
    };

    let cronTime = "0 0 1 1 *"; 
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      if (data.cron) cronTime = data.cron;
    }
    setupCron(cronTime);
    module.exports.setupCron = setupCron;
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;
    const action = args[0]?.toLowerCase();
    const cacheDir = path.join(__dirname, "cache");
    const assetDir = path.join(__dirname, "assets", "image");
    const jsonPath = path.join(cacheDir, "newyear_global.json");
    const localImgPath = path.join(assetDir, "festival.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });

    let globalData = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, "utf-8")) : {};

    // --- 4. REPLACE (English Reply) ---
    if (action === "replace") {
      const fileName = args[1];
      if (!fileName) return api.sendMessage("⚠️ Please provide a file name. Example: {pn} replace photo.jpg", threadID, messageID);
      
      if (type !== "message_reply" || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ Please reply to an image to use this command.", threadID, messageID);
      }

      const imgUrl = messageReply.attachments[0].url;
      const targetPath = path.join(assetDir, fileName);

      try {
        const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(targetPath, Buffer.from(response.data, 'binary'));
        return api.sendMessage(`✅ File '${fileName}' has been successfully replaced.`, threadID, messageID);
      } catch (err) {
        return api.sendMessage("❌ Failed to download or save the image.", threadID, messageID);
      }
    }

    // --- 1. TEXT (English Reply) ---
    if (action === "text") {
      const newMsg = args.slice(1).join(" ");
      if (!newMsg) return api.sendMessage("⚠️ Invalid Format! Correct usage: {pn} text <your message>", threadID, messageID);
      globalData.message = newMsg;
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      return api.sendMessage("✅ Global message has been updated.", threadID, messageID);
    }

    // --- 2. SET (English Reply) ---
    if (action === "set") {
      const timeInput = args.slice(1).join(" "); 
      const m = moment.tz(timeInput, "DD-MM-YYYY hh:mmA", "Asia/Dhaka");
      if (!timeInput || !m.isValid()) return api.sendMessage("⚠️ Invalid Format! Correct usage: {pn} set 02-01-2026 12:00AM", threadID, messageID);

      const cronTime = `${m.minutes()} ${m.hours()} ${m.date()} ${m.month() + 1} *`;
      globalData.cron = cronTime;
      globalData.timeString = timeInput;
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      
      module.exports.setupCron(cronTime);
      return api.sendMessage(`✅ New schedule set for: ${timeInput}`, threadID, messageID);
    }

    // --- 3. RESET (English Reply) ---
    if (action === "reset") {
      const defaultCron = "0 0 1 1 *";
      globalData = { cron: defaultCron };
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      module.exports.setupCron(defaultCron);
      return api.sendMessage("✅ Message and schedule have been reset to default.", threadID, messageID);
    }

    // --- 4. CHECK (English Reply) ---
    if (action === "check") {
      const customMsg = globalData.message || `🎊 HAPPY NEW YEAR 2026 🎊\n━━━━━━━━━━━━━━\n🌟 Goodbye 2025, Welcome 2026! 🌟\n\nMay the new year bring endless joy, peace, and success to your life. ✨\n━━━━━━━━━━━━━━\n💖 Wish you a great year ahead!`;
      const timeMsg = globalData.timeString ? `⏰ Scheduled for: ${globalData.timeString}` : `⏰ Scheduled for: 1st January Midnight`;
      const sampleMsg = `🎁 [GLOBAL PREVIEW]\n\n${customMsg}\n\n${timeMsg}`;
      
      if (fs.existsSync(localImgPath)) {
        return api.sendMessage({ body: sampleMsg, attachment: fs.createReadStream(localImgPath) }, threadID, messageID);
      } else {
        return api.sendMessage(sampleMsg + "\n\n⚠️ Note: Local image not found.", threadID, messageID);
      }
    }

    return api.sendMessage("ℹ️ Usage Guide:\n1. {pn} text <message>\n2. {pn} set DD-MM-YYYY HH:mmAM/PM\n3. {pn} replace <filename.jpg> (reply to image)\n4. {pn} check\n5. {pn} reset", threadID, messageID);
  }
};
      
