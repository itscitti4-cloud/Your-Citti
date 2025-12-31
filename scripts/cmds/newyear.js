const cron = require("node-cron");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "newyear",
    aliases: ["ny"],
    version: "1.3.0",
    author: "AkHi",
    countDown: 5,
    role: 2, // Admin only for global changes
    shortDescription: "Manage global New Year wishing with local image",
    category: "utility",
    guide: "{pn} text <your message>\n{pn} check"
  },

  onLoad: async function ({ api }) {
    // 31st December midnight (Start of 1st January)
    cron.schedule("0 0 1 1 *", async () => {
      const allThreads = await api.getThreadList(500, null, ["INBOX"]);
      const year = moment.tz("Asia/Dhaka").format("YYYY");
      
      const cacheDir = path.join(__dirname, "cache");
      const jsonPath = path.join(cacheDir, "newyear_global.json");
      const localImgPath = path.join(__dirname, "assets", "image", "golden-happy-new-year-2026-celebration-with-clock-fireworks_783182-823.jpg");

      let globalData = {};
      if (fs.existsSync(jsonPath)) {
        globalData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      }

      const customMsg = globalData.message || `🌟 Goodbye 2025, Welcome 2026! 🌟\n\nMay the new year bring endless joy, peace, and success to your life. ✨`;
      const finalMsg = `🎊 HAPPY NEW YEAR ${year} 🎊\n━━━━━━━━━━━━━━\n${customMsg}\n━━━━━━━━━━━━━━\n💖 Wish you a great year ahead!`;

      for (const thread of allThreads) {
        if (thread.isGroup && thread.isSubscribed) {
          try {
            const sendData = fs.existsSync(localImgPath) 
              ? { body: finalMsg, attachment: fs.createReadStream(localImgPath) }
              : { body: finalMsg };
            
            await api.sendMessage(sendData, thread.threadID);
          } catch (error) {
            console.log(`Failed to send message to thread: ${thread.threadID}. Moving to next...`);
            continue; 
          }
        }
      }
    }, {
      scheduled: true,
      timezone: "Asia/Dhaka"
    });
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const action = args[0]?.toLowerCase();
    const cacheDir = path.join(__dirname, "cache");
    const jsonPath = path.join(cacheDir, "newyear_global.json");
    const localImgPath = path.join(__dirname, "assets", "image", "golden-happy-new-year-2026-celebration-with-clock-fireworks_783182-823.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, "{}");

    let globalData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    if (action === "text") {
      const newMsg = args.slice(1).join(" ");
      if (!newMsg) return api.sendMessage("❌ Please provide a message.\nExample: !newyear text Happy New Year everyone!", threadID, messageID);

      globalData.message = newMsg;
      fs.writeFileSync(jsonPath, JSON.stringify(globalData, null, 2));
      return api.sendMessage("✅ Global New Year message has been updated for all groups.", threadID, messageID);
    }

    if (action === "check") {
      const year = moment.tz("Asia/Dhaka").format("YYYY");
      const customMsg = globalData.message || `🌟 Goodbye 2025, Welcome 2026! 🌟\n\nMay the new year bring endless joy, peace, and success to your life. ✨`;
      
      const sampleMsg = `🎁 [GLOBAL PREVIEW]\n━━━━━━━━━━━━━━\n🎊 HAPPY NEW YEAR ${year} 🎊\n━━━━━━━━━━━━━━\n${customMsg}\n━━━━━━━━━━━━━━\n💖 Wish you a great year ahead!`;

      if (fs.existsSync(localImgPath)) {
        return api.sendMessage({ body: sampleMsg, attachment: fs.createReadStream(localImgPath) }, threadID, messageID);
      } else {
        return api.sendMessage(sampleMsg + "\n\n⚠️ Note: Local image not found in assets folder.", threadID, messageID);
      }
    }

    return api.sendMessage("ℹ️ Use '!newyear text <message>' to set global wish or '!newyear check' for preview.", threadID, messageID);
  }
};
