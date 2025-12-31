const cron = require("node-cron");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require("path");

let scheduledTask = null;

module.exports = {
  config: {
    name: "festival",
    aliases: ["fstvl"],
    version: "1.4.2",
    author: "AkHi",
    countDown: 5,
    role: 1,
    shortDescription: "Manage global event wishing with local image",
    category: "utility",
    guide: "{pn} text <your message>\n{pn} set DD-MM-YYYY HH:mmAM/PM\n{pn} reset\n{pn} check"
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
    const { threadID, messageID } = event;
    const action = args[0]?.toLowerCase();
    const cacheDir = path.join(__dirname, "cache");
    const jsonPath = path.join(cacheDir, "newyear_global.json");
    const localImgPath = path.join(__dirname, "assets", "image", "golden-happy-new-year-2026-celebration-with-clock-fireworks_783182-823.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    let globalData = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, "utf-8")) : {};

    // 1. TEXT - Customize Message
    if (action === "text") {
      const newMsg = args.slice(1).join(" ");
      if (!newMsg) return api.sendMessage("⚠️ Invalid Format! Correct usage: !ny text <your message>", threadID, messageID);
      globalData.message = newMsg;
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      return api.sendMessage("✅ Global message has been updated.", threadID, messageID);
    }

    // 2. SET - Custom Date & Time
    if (action === "set") {
      const timeInput = args.slice(1).join(" "); 
      const m = moment.tz(timeInput, "DD-MM-YYYY hh:mmA", "Asia/Dhaka");
      
      if (!timeInput || !m.isValid()) {
        return api.sendMessage("⚠️ Invalid Format! Correct usage: !ny set 02-01-2026 12:00AM", threadID, messageID);
      }

      const cronTime = `${m.minutes()} ${m.hours()} ${m.date()} ${m.month() + 1} *`;
      globalData.cron = cronTime;
      globalData.timeString = timeInput;
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      
      module.exports.setupCron(cronTime);
      return api.sendMessage(`✅ New schedule set for: ${timeInput}`, threadID, messageID);
    }

    // 3. RESET - Back to default
    if (action === "reset") {
      const defaultCron = "0 0 1 1 *";
      globalData = { cron: defaultCron };
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      module.exports.setupCron(defaultCron);
      return api.sendMessage("✅ Message and schedule have been reset to default New Year mode.", threadID, messageID);
    }

    // 4. CHECK - Preview (Now ensures image is attached if available)
    if (action === "check") {
      const customMsg = globalData.message || `🎊 HAPPY NEW YEAR 2026 🎊\n━━━━━━━━━━━━━━\n🌟 Goodbye 2025, Welcome 2026! 🌟\n\nMay the new year bring endless joy, peace, and success to your life. ✨\n━━━━━━━━━━━━━━\n💖 Wish you a great year ahead!`;
      const timeMsg = globalData.timeString ? `⏰ Scheduled for: ${globalData.timeString}` : `⏰ Scheduled for: 1st January Midnight`;
      
      const sampleMsg = `🎁 [GLOBAL PREVIEW]\n\n${customMsg}\n\n${timeMsg}`;
      
      // Checking if local image exists to send along with preview
      if (fs.existsSync(localImgPath)) {
        return api.sendMessage({ body: sampleMsg, attachment: fs.createReadStream(localImgPath) }, threadID, messageID);
      } else {
        return api.sendMessage(sampleMsg + "\n\n⚠️ Note: Local image not found in assets folder.", threadID, messageID);
      }
    }

    return api.sendMessage("ℹ️ Usage Guide:\n1. !ny text <message> (Set wish message)\n2. !ny set DD-MM-YYYY HH:mmAM/PM (Set specific time)\n3. !ny reset (Reset all settings)\n4. !ny check (Preview message)", threadID, messageID);
  }
};
