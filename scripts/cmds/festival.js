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
    version: "1.6.0",
    author: "AkHi",
    countDown: 5,
    role: 1,
    shortDescription: "Manage global event wishing with local image",
    category: "utility",
    guide: "{pn} text <your message>\n{pn} set DD-MM-YYYY HH:mmAM/PM\n{pn} reset\n{pn} check\n{pn} replace"
  },

  onLoad: async function ({ api }) {
    const cacheDir = path.join(__dirname, "cache");
    const jsonPath = path.join(cacheDir, "festival_config.json");
    const assetDir = path.join(__dirname, "assets", "image");
    const localImgPath = path.join(assetDir, "festival.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });

    const setupCron = (cronTime) => {
      if (scheduledTask) scheduledTask.stop();
      scheduledTask = cron.schedule(cronTime, async () => {
        try {
          const list = await api.getThreadList(500, null, ["INBOX"]);
          const allThreads = list.filter(t => t.isGroup && t.isSubscribed);
          
          let globalData = {};
          if (fs.existsSync(jsonPath)) globalData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

          const finalMsg = globalData.message || "🎊 HAPPY NEW YEAR 2026 🎊";

          for (const thread of allThreads) {
            const sendData = fs.existsSync(localImgPath) 
              ? { body: finalMsg, attachment: fs.createReadStream(localImgPath) }
              : { body: finalMsg };
            api.sendMessage(sendData, thread.threadID);
          }
        } catch (e) { console.error(e); }
      }, { scheduled: true, timezone: "Asia/Dhaka" });
    };

    // রিস্টার্টের পর ডাটা লোড করা
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
    const jsonPath = path.join(cacheDir, "festival_config.json");
    const localImgPath = path.join(assetDir, "festival.jpg");

    let globalData = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, "utf-8")) : {};

    // --- REPLACE (Reply to Image) ---
    if (action === "replace") {
      if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ Please reply to an image to replace the festival banner.", threadID, messageID);
      }
      const imgUrl = messageReply.attachments[0].url;
      try {
        const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(localImgPath, Buffer.from(response.data, 'binary'));
        return api.sendMessage("✅ Festival image has been updated successfully.", threadID, messageID);
      } catch (err) {
        return api.sendMessage("❌ Failed to update image.", threadID, messageID);
      }
    }

    // --- TEXT ---
    if (action === "text") {
      const newMsg = args.slice(1).join(" ");
      if (!newMsg) return api.sendMessage("⚠️ Provide a message!", threadID, messageID);
      globalData.message = newMsg;
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      return api.sendMessage("✅ Global message updated.", threadID, messageID);
    }

    // --- SET ---
    if (action === "set") {
      const timeInput = args.slice(1).join(" "); 
      const m = moment.tz(timeInput, "DD-MM-YYYY hh:mmA", "Asia/Dhaka");
      if (!m.isValid()) return api.sendMessage("⚠️ Format: set 01-01-2026 12:00AM", threadID, messageID);

      const cronTime = `${m.minutes()} ${m.hours()} ${m.date()} ${m.month() + 1} *`;
      globalData.cron = cronTime;
      globalData.timeString = timeInput;
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      
      module.exports.setupCron(cronTime);
      return api.sendMessage(`✅ Schedule set for: ${timeInput}`, threadID, messageID);
    }

    // --- CHECK ---
    if (action === "check") {
      const customMsg = globalData.message || "Default Festival Message";
      const timeMsg = globalData.timeString ? `⏰ Time: ${globalData.timeString}` : `⏰ Time: 1st Jan`;
      const sampleMsg = `🎁 [PREVIEW]\n\n${customMsg}\n\n${timeMsg}`;
      
      return api.sendMessage({
        body: sampleMsg,
        attachment: fs.existsSync(localImgPath) ? fs.createReadStream(localImgPath) : null
      }, threadID, messageID);
    }

    // --- RESET ---
    if (action === "reset") {
      if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
      if (fs.existsSync(localImgPath)) fs.unlinkSync(localImgPath);
      module.exports.setupCron("0 0 1 1 *");
      return api.sendMessage("✅ Reset complete.", threadID, messageID);
    }

    return api.sendMessage("1. text <msg>\n2. set <time>\n3. replace (reply img)\n4. check\n5. reset", threadID, messageID);
  }
};
