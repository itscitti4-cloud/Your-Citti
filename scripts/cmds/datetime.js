const moment = require('moment-timezone');
require('moment-hijri'); 

module.exports = {
  config: {
    name: "datetime",
    aliases: ["date", "time", "clock"],
    version: "2.9",
    author: "AkHi",
    countdown: 5,
    role: 0,
    shortDescription: "Shows time and date in Bengali, Arabic & English.",
    category: "utility",
    guide: "{prefix}{name}"
  },

  onStart: async function ({ message }) {
    try {
      const timezone = "Asia/Dhaka";
      // locale('en') ব্যবহার করে ইংরেজি সংখ্যা ও অক্ষর নিশ্চিত করা হলো
      const now = moment().tz(timezone).locale('en');
      
      // ১. ইংরেজি তারিখ
      const engDate = now.format("DD MMMM, YYYY");

      // ২. বাংলা তারিখ (সরাসরি বাংলা মাস ও বছরে)
      const bngDate = new Intl.DateTimeFormat('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(now.toDate());

      // ৩. হিজরি তারিখ (বাংলা মাসে রূপান্তর)
      const hijriMonthsBn = {
        'Muharram': 'মুহররম', 'Safar': 'সফর', 'Rabi\' al-awwal': 'রবিউল আউয়াল',
        'Rabi\' ath-thani': 'রবিউস সানি', 'Jumada al-ula': 'জুমাদাল উলা',
        'Jumada al-akhira': 'জুমাদাস সানি', 'Rajab': 'রজব', 'Sha\'ban': 'শাবান',
        'Ramadan': 'রমজান', 'Shawwal': 'শাওয়াল', 'Dhu al-Qi\'dah': 'জিলকদ',
        'Dhu al-Hijjah': 'জিলহজ'
      };

      const hijriDay = now.iDate(); // হিজরি দিন
      const hijriMonthEn = now.format("iMMMM"); // হিজরি মাস (ইংরেজি নাম)
      const hijriYear = now.iFullYear(); // হিজরি বছর
      const hijriMonthBn = hijriMonthsBn[hijriMonthEn] || hijriMonthEn;
      
      const hijriDateFinal = `${hijriDay} ${hijriMonthBn}, ${hijriYear}`;

      const premiumReply = 
        `»—☀️— **𝐓𝐈𝐌𝐄 𝐃𝐄𝐓𝐀𝐈𝐋𝐒** —☀️—«\n\n` +
        ` ➤ 𝐓𝐢𝐦𝐞: ${now.format("hh:mm A")}\n` +
        ` ➤ 𝐃𝐚𝐲: ${now.format("dddd")}\n\n` +
        ` ➤ 𝐃𝐚𝐭𝐞: ${engDate}\n` +
        ` ➤ বাংলা: ${bngDate}\n` +
        ` ➤ হিজরী: ${hijriDateFinal}\n\n` +
        `»——— @Lubna Jannat ———«`;

      return message.reply(premiumReply);

    } catch (error) {
      console.error("Error:", error);
      message.reply("⚠️ An error occurred while retrieving the time details.");
    }
  }
};
