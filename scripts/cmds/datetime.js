const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "datetime",
    aliases: ["date", "time", "clock"],
    version: "2.0",
    author: "AkHi",
    countdown: 5,
    role: 0,
    shortDescription: "বাংলাদেশ ও অন্যান্য গুরুত্বপূর্ণ দেশের প্রিমিয়াম টাইম ও ডেট।",
    category: "utility",
    guide: "{prefix}{name}"
  },

  onStart: async function ({ message }) {
    try {
      const timezone = "Asia/Dhaka";
      const now = moment().tz(timezone);

      // প্রিমিয়াম স্টাইল ডিজাইনিং
      const premiumReply = 
        `╔══════════════════╗\n` +
        `       🕒 **𝐃𝐇𝐀𝐊𝐀 𝐂𝐋𝐎𝐂𝐊**\n` +
        `╚══════════════════╝\n\n` +
        `  📅 **𝐃𝐚𝐭𝐞:** ${now.format("DD MMMM YYYY")}\n` +
        `  🌟 **𝐃𝐚𝐲:** ${now.format("dddd")}\n` +
        `  ⏰ **𝐓𝐢𝐦𝐞:** ${now.format("hh:mm:ss A")}\n` +
        `  🌐 **𝐙𝐨𝐧𝐞:** GMT+6 (Bangladesh)\n\n` +
        `  💡 *Have a productive day!* \n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `  **𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝 𝐛𝐲:** Lubna Jannat AkHi`;

      return message.reply(premiumReply);

    } catch (error) {
      console.error("Error retrieving date and time:", error);
      message.reply("⚠️ সিস্টেমের সময় নির্ণয় করতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  }
};
