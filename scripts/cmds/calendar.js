const moment = require("moment-timezone");
const { ArabicDate } = require("islamic-date-utils"); // আরবি তারিখের জন্য

module.exports = {
  config: {
    name: "calendar",
    aliases: ["dab", "bangla", "arabic"],
    version: "1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Shows current Bangla and Arabic dates",
    longDescription: "View the current date in Bengali and Hijri (Arabic) calendars with seasons.",
    category: "utility",
    guide: "{pn}"
  },

  onStart: async function ({ message }) {
    const time = moment.tz("Asia/Dhaka");
    
    // ১. ইংরেজি তারিখ ও সময়
    const engDate = time.format("DD MMMM YYYY");
    const dayName = time.format("dddd");

    // ২. বাংলা তারিখ ক্যালকুলেশন
    const getBanglaDate = (date) => {
      const day = parseInt(date.format("D"));
      const month = parseInt(date.format("M"));
      const year = parseInt(date.format("YYYY"));
      
      let bDay, bMonth, bYear, season;
      
      bYear = month < 4 || (month === 4 && day < 14) ? year - 594 : year - 593;

      if ((month === 4 && day >= 14) || (month === 5 && day <= 14)) { bMonth = "বৈশাখ"; season = "গ্রীষ্ম"; bDay = day >= 14 ? day - 13 : day + 17; }
      else if ((month === 5 && day >= 15) || (month === 6 && day <= 15)) { bMonth = "জ্যৈষ্ঠ"; season = "গ্রীষ্ম"; bDay = day >= 15 ? day - 14 : day + 17; }
      else if ((month === 6 && day >= 16) || (month === 7 && day <= 16)) { bMonth = "আষাঢ়"; season = "বর্ষা"; bDay = day >= 16 ? day - 15 : day + 16; }
      else if ((month === 7 && day >= 17) || (month === 8 && day <= 16)) { bMonth = "শ্রাবণ"; season = "বর্ষা"; bDay = day >= 17 ? day - 16 : day + 15; }
      else if ((month === 8 && day >= 17) || (month === 9 && day <= 16)) { bMonth = "ভাদ্র"; season = "শরৎ"; bDay = day >= 17 ? day - 16 : day + 15; }
      else if ((month === 9 && day >= 17) || (month === 10 && day <= 17)) { bMonth = "আশ্বিন"; season = "শরৎ"; bDay = day >= 17 ? day - 16 : day + 14; }
      else if ((month === 10 && day >= 18) || (month === 11 && day <= 16)) { bMonth = "কার্তিক"; season = "হেমন্ত"; bDay = day >= 18 ? day - 17 : day + 14; }
      else if ((month === 11 && day >= 17) || (month === 12 && day <= 15)) { bMonth = "অগ্রহায়ণ"; season = "হেমন্ত"; bDay = day >= 17 ? day - 16 : day + 14; }
      else if ((month === 12 && day >= 16) || (month === 1 && day <= 14)) { bMonth = "পৌষ"; season = "শীত"; bDay = day >= 16 ? day - 15 : day + 16; }
      else if ((month === 1 && day >= 15) || (month === 2 && day <= 13)) { bMonth = "মাঘ"; season = "শীত"; bDay = day >= 15 ? day - 14 : day + 17; }
      else if ((month === 2 && day >= 14) || (month === 3 && day <= 14)) { bMonth = "ফাল্গুন"; season = "বসন্ত"; bDay = day >= 14 ? day - 13 : day + 15; }
      else { bMonth = "চৈত্র"; season = "বসন্ত"; bDay = day >= 15 ? day - 14 : day + 17; }

      return { bDay, bMonth, bYear, season };
    };

    const bangla = getBanglaDate(time);

    // ৩. আরবি (হিজরি) তারিখ
    // নোট: পশতু/আরবি ক্যালেন্ডার অনুযায়ী ১ দিন কম-বেশি হতে পারে চাঁদের ওপর ভিত্তি করে
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-uma', {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date());

    const result = `📅 [ 𝗖𝗨𝗥𝗥𝗘𝗡𝗧 𝗗𝗔𝗧𝗘 ] 📅\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🏴󠁧󠁢󠁥󠁮󠁧󠁿 English: ${engDate} (${dayName})\n` +
      `🇧🇩 Bangla: ${bangla.bDay} ${bangla.bMonth}, ${bangla.bYear} বঙ্গাব্দ\n` +
      `🌿 Season: ${bangla.season}\n` +
      `☪️ Arabic: ${hijriDate} হিজরি\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✨ Have a wonderful day!`;

    return message.reply(result);
  }
};
