const moment = require('moment-timezone');
require('moment-hijri');

module.exports = {
  config: {
    name: "datetime",
    aliases: ["date", "time", "clock"],
    version: "3.5",
    author: "AkHi",
    countdown: 5,
    role: 0,
    shortDescription: "Shows time and date with Bengali Calendar (Boishakh) and Hijri.",
    category: "utility",
    guide: "{prefix}{name}"
  },

  onStart: async function ({ message }) {
    try {
      const timezone = "Asia/Dhaka";
      const now = moment().tz(timezone).locale('en');

      // ১. ইংরেজি সময় ও তারিখ
      const timeStr = now.format("hh:mm A");
      const dayStr = now.format("dddd");
      const engDate = now.format("DD MMMM, YYYY");

      // ২. বঙ্গাব্দ (বৈশাখ-জ্যৈষ্ঠ) ক্যালকুলেশন
      const getBengaliDate = (date) => {
        const d = new Date(date);
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        let bYear = year - 593;
        let bDay, bMonth;

        // বাংলা মাস ও দিনের সাধারণ হিসাব (বাংলাদেশি স্ট্যান্ডার্ড)
        const months = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
        const monthDays = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30]; // সংশোধিত নিয়ম

        if (month < 4 || (month === 4 && day < 14)) bYear -= 1;

        // ১৪ই এপ্রিল থেকে বৈশাখ শুরু
        let totalDays = Math.floor((d - new Date(year, 3, 14)) / (24 * 60 * 60 * 1000));
        
        if (totalDays < 0) {
          let prevYear = year - 1;
          totalDays = Math.floor((d - new Date(prevYear, 3, 14)) / (24 * 60 * 60 * 1000));
        }

        let mIndex = 0;
        while (totalDays >= monthDays[mIndex]) {
          totalDays -= monthDays[mIndex];
          mIndex++;
        }
        
        bDay = totalDays + 1;
        bMonth = months[mIndex];
        
        // সংখ্যাকে বাংলা অক্ষরে রূপান্তর
        const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
        return `${toBn(bDay)} ${bMonth}, ${toBn(bYear)}`;
      };

      const bngDate = getBengaliDate(now.toDate());

      // ৩. হিজরি তারিখ (আরবি ১২ মাস বাংলায়)
      const hijriMonthsBn = {
        'Muharram': 'মুহররম', 'Safar': 'সফর', 'Rabi\' al-awwal': 'রবিউল আউয়াল',
        'Rabi\' ath-thani': 'রবিউস সানি', 'Jumada al-ula': 'জুমাদাল উলা',
        'Jumada al-akhira': 'জুমাদাস সানি', 'Rajab': 'রজব', 'Sha\'ban': 'শাবান',
        'Ramadan': 'রমজান', 'Shawwal': 'শাওয়াল', 'Dhu al-Qi\'dah': 'জিলকদ',
        'Dhu al-Hijjah': 'জিলহজ'
      };

      const hijriDay = now.format("iD"); 
      const hijriMonthEn = now.format("iMMMM"); 
      const hijriYear = now.format("iYYYY"); 
      const hijriMonthBn = hijriMonthsBn[hijriMonthEn] || hijriMonthEn;
      const hijriDateFinal = `${hijriDay} ${hijriMonthBn}, ${hijriYear}`;

      const premiumReply = 
        `»—☀️— **𝐓𝐈𝐌𝐄 𝐃𝐄𝐓𝐀𝐈𝐋𝐒** —☀️—«\n\n` +
        ` ➤ 𝐓𝐢𝐦𝐞: ${timeStr}\n` +
        ` ➤ 𝐃𝐚𝐲: ${dayStr}\n\n` +
        ` ➤ 𝐃𝐚𝐭𝐞: ${engDate}\n` +
        ` ➤ বাংলা: ${bngDate}\n` +
        ` ➤ হিজরী: ${hijriDateFinal}\n\n` +
        `»——— @Lubna Jannat ———«`;

      return message.reply(premiumReply);

    } catch (error) {
      console.error(error);
      message.reply("⚠️ তারিখ প্রদর্শনে সমস্যা হয়েছে।");
    }
  }
};
                                 
