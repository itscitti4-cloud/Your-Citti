const moment = require('moment-timezone');
require('moment-hijri'); 

module.exports = {
  config: {
    name: "datetime",
    aliases: ["date", "time", "clock"],
    version: "2.6",
    author: "AkHi",
    countdown: 5,
    role: 0,
    shortDescription: "Shows premium time and date (English, Bangla & Hijri).",
    category: "utility",
    guide: "{prefix}{name}"
  },

  onStart: async function ({ message }) {
    try {
      const timezone = "Asia/Dhaka";
      const now = moment().tz(timezone);
      
      const hijriDate = now.format("iD iMMMM iYYYY");

      const bngDate = new Intl.DateTimeFormat('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(now.toDate());

      // premiumReply stays exactly as you provided
      const premiumReply = 
        `»—☀️— **𝐓𝐈𝐌𝐄 𝐃𝐄𝐓𝐀𝐈𝐋𝐒** —☀️—«\n\n` +
        ` ➤ 𝐃𝐚𝐭𝐞: ${now.format("DD-MMMM-YYYY")}\n` +
        ` ➤ 𝐁𝐚𝐧𝐠𝐥𝐚: ${bngDate}\n` +
        ` ➤ 𝐇𝐢𝐣𝐫𝐢: ${hijriDate}\n` +
        ` ➤ 𝐓𝐢𝐦𝐞: ${now.format("hh:mm A")}\n` +
        ` ➤ 𝐃𝐚𝐲: ${now.format("dddd")}\n\n` +
        `»——— @Lubna Jannat ———«`;

      return message.reply(premiumReply);

    } catch (error) {
      console.error("Error retrieving date and time:", error);
      // Error message changed to English as per your request
      message.reply("⚠️ An error occurred while retrieving the system time. Please ensure 'moment-hijri' is installed in your package.json.");
    }
  }
};
