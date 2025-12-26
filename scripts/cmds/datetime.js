const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "clock",
    aliases: ["datetime", "time"],
    version: "6.0",
    author: "AkHi",
    category: "utility"
  },

  onStart: async function ({ message }) {
    try {
      const timezone = "Asia/Dhaka";
      const now = moment().tz(timezone).locale('en');

      // ১. ইংরেজি সময়, বার ও তারিখ
      const timeStr = now.format("hh:mm A");
      const dayStr = now.format("dddd");
      const engDate = now.format("DD MMMM, YYYY");

      // ২. বঙ্গাব্দ ক্যালকুলেশন (বৈশাখ-জ্যৈষ্ঠ মাস অনুযায়ী)
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
        if (totalDays < 0) totalDays = Math.floor((d - new Date(year - 1, 3, 14)) / (24 * 60 * 60 * 1000));
        let mIndex = 0;
        while (totalDays >= monthDays[mIndex]) { totalDays -= monthDays[mIndex]; mIndex++; }
        const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
        return `${toBn(totalDays + 1)} ${months[mIndex]}, ${toBn(bYear)}`;
      };

      // ৩. হিজরী তারিখ ক্যালকুলেশন (Kuwaiti Algorithm)
      const getHijriDate = (date) => {
        let d = date.getDate();
        let m = date.getMonth() + 1;
        let y = date.getFullYear();
        if (m < 3) { y -= 1; m += 12; }

        let a = Math.floor(y / 100);
        let b = 2 - a + Math.floor(a / 4);
        let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
        
        // তারিখ অ্যাডজাস্টমেন্ট (চাঁদ দেখা অনুযায়ী +১ দিন যোগ করা হয়েছে)
        let z = jd + 1; 
        let l = z + 68569;
        let n = Math.floor((4 * l) / 146097);
        l = l - Math.floor((146097 * n + 3) / 4);
        let i = Math.floor((4000 * (l + 1)) / 1461001);
        l = l - Math.floor((1461 * i) / 4) + 31;
        let j = Math.floor((80 * l) / 2447);
        d = l - Math.floor((2447 * j) / 80);
        l = Math.floor(j / 11);
        m = j + 2 - 12 * l;
        y = 100 * (n - 49) + i + l;

        const hijriMonthsBn = ["মুহররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জুমাদাল উলা", "জুমাদাস সানি", "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"];
        return `${d} ${hijriMonthsBn[m - 1]}, ${y}`;
      };

      const bngDate = getBengaliDate(now.toDate());
      const hijriDateFinal = getHijriDate(now.toDate());

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
        
