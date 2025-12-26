const moment = require('moment-timezone');
const hijri = require('moment-hijri'); // সরাসরি হিজরি মডিউলটি আলাদাভাবে নেওয়া হলো

module.exports = {
  config: {
    name: "datetime",
    aliases: ["date", "time", "clock"],
    version: "3.7",
    author: "AkHi",
    countdown: 5,
    role: 0,
    shortDescription: "Shows time and date with corrected Hijri and Bengali calendar.",
    category: "utility",
    guide: "{prefix}{name}"
  },

  onStart: async function ({ message }) {
    try {
      const timezone = "Asia/Dhaka";
      // ইংরেজি সংখ্যা নিশ্চিত করতে locale('en')
      const now = moment().tz(timezone).locale('en');

      // ১. ইংরেজি সময় ও তারিখ
      const timeStr = now.format("hh:mm A");
      const dayStr = now.format("dddd");
      const engDate = now.format("DD MMMM, YYYY");

      // ২. বঙ্গাব্দ ক্যালকুলেশন (বৈশাখ-জ্যৈষ্ঠ)
      const getBengaliDate = (date) => {
        const d = new Date(date);
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        let bYear = year - 593;
        const months = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
        const monthDays = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30]; 

        if (month < 4 || (month === 4 && day < 14)) bYear -= 1;

        let totalDays = Math.floor((d - new Date(year, 3, 14)) / (24 * 60 * 60 * 1000));
        if (totalDays < 0) {
          totalDays = Math.floor((d - new Date(year - 1, 3, 14)) / (24 * 60 * 60 * 1000));
        }

        let mIndex = 0;
        while (totalDays >= monthDays[mIndex]) {
          totalDays -= monthDays[mIndex];
          mIndex++;
        }
        
        const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
        return `${toBn(totalDays + 1)} ${months[mIndex]}, ${toBn(bYear)}`;
      };

      const bngDate = getBengaliDate(now.toDate());

      // ৩. হিজরি তারিখ (নিখুঁত করার জন্য iFullYear মেথড ব্যবহার)
      const hijriMonthsBn = {
        0: 'মুহররম', 1: 'সফর', 2: 'রবিউল আউয়াল', 3: 'রবিউস সানি',
        4: 'জুমাদাল উলা', 5: 'জুমাদাস সানি', 6: 'রজব', 7: 'শাবান',
        8: 'রমজান', 9: 'শাওয়াল', 10: 'জিলকদ', 11: 'জিলহজ'
      };

      // moment-hijri এর ফাংশনগুলো নিরাপদভাবে কল করা
      const hDay = now.iDate(); 
      const hMonthNum = now.iMonth(); 
      const hYear = now.iFullYear();
      const hMonthBn = hijriMonthsBn[hMonthNum] || "অজানা মাস";
      
      const hijriDateFinal = `${hDay} ${hMonthBn}, ${hYear}`;

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
      // কনসোলে চেক করুন ঠিক কোন জায়গায় এরর হচ্ছে
      console.log("Error Details:", error.message);
      message.reply("⚠️ সিস্টেম এরর! আপনার মডিউলগুলো (moment-timezone, moment-hijri) ঠিকমতো ইনস্টল করা আছে কি না চেক করুন।");
    }
  }
};
