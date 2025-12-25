const moment = require('moment-timezone');
const { ArabicDate } = require('islamic-date-res-bt'); // নিশ্চিত করুন এই প্যাকেজটি ইনস্টল আছে

module.exports = {
  config: {
    name: "datetime",
    aliases: ["date", "time", "clock"],
    version: "2.5",
    author: "AkHi",
    countdown: 5,
    role: 0,
    shortDescription: "বাংলাদেশ, বাংলা ও আরবি প্রিমিয়াম টাইম ও ডেট।",
    category: "utility",
    guide: "{prefix}{name}"
  },

  onStart: async function ({ message }) {
    try {
      const timezone = "Asia/Dhaka";
      const now = moment().tz(timezone);
      
      // আরবি তারিখ ক্যালকুলেশন
      const islamicDate = new ArabicDate(now.toDate());
      const hijriDate = islamicDate.format("DD MMMM YYYY");

      // বাংলা তারিখ ক্যালকুলেশন (সহজ ফরম্যাট)
      const bngDate = new Intl.DateTimeFormat('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(now.toDate());

      // আপনার দেওয়া নতুন প্রিমিয়াম স্টাইল
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
      message.reply("⚠️ সিস্টেমের সময় নির্ণয় করতে ত্রুটি হয়েছে। নিশ্চিত করুন সব প্যাকেজ ইনস্টল আছে।");
    }
  }
};
