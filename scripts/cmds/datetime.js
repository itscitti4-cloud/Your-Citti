const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "clock",
    aliases: ["datetime", "time"],
    version: "10.4",
    author: "AkHi",
    category: "utility"
  },

  onStart: async function ({ message }) {
    try {
      const timezone = "Asia/Dhaka";
      const now = moment().tz(timezone);

      // সংখ্যাকে বাংলা অক্ষরে রূপান্তর করার ফাংশন
      const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

      const timeStr = now.format("hh:mm A");
      const dayStr = now.format("dddd");
      const engDate = now.format("DD MMMM, YYYY");

      // ১. সংশোধিত বঙ্গাব্দ ক্যালকুলেশন (রাত ১২টায় পরিবর্তন এবং সঠিক দিন গণনা)
      const getBengaliDate = (mDate) => {
        const year = mDate.year();
        const month = mDate.month() + 1;
        const day = mDate.date();

        let bYear = year - 593;
        const months = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
        
        // সংশোধিত বাংলা একাডেমি ক্যালেন্ডার অনুযায়ী মাসগুলোর দিন সংখ্যা
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const monthDays = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, (isLeapYear ? 31 : 30)];

        if (month < 4 || (month === 4 && day < 14)) {
          bYear -= 1;
        }

        // বৈশাখ শুরু হয় ১৪ এপ্রিল
        let startOfBengaliYear = moment.tz(`${year}-04-14`, "YYYY-MM-DD", timezone);
        if (mDate.isBefore(startOfBengaliYear)) {
          startOfBengaliYear = moment.tz(`${year - 1}-04-14`, "YYYY-MM-DD", timezone);
        }

        let totalDays = mDate.diff(startOfBengaliYear, 'days');
        
        let mIndex = 0;
        // দিন গণনা ঠিক রাখতে totalDays এর লজিক আপডেট
        while (mIndex < 12 && totalDays >= monthDays[mIndex]) {
          totalDays -= monthDays[mIndex];
          mIndex++;
        }

        // মাস যদি ১২ এর সমান হয়ে যায় (চৈত্র মাসের শেষে)
        if (mIndex === 12) mIndex = 11;

        return `${toBn(totalDays + 1)} ${months[mIndex]}, ${toBn(bYear)}`;
      };

      // ২. হিজরি তারিখ ক্যালকুলেশন (রাত ১২টায় পরিবর্তনের জন্য সঠিক কুয়েতি ক্যালেন্ডার লজিক)
      const getHijriDate = (mDate) => {
        const d = mDate.date();
        const m = mDate.month();
        const y = mDate.year();

        // জুলিয়ান ডে ক্যালকুলেশন
        let jd = Math.floor(367 * y - (7 * (y + Math.floor((m + 9) / 12))) / 4 + Math.floor((275 * (m + 1)) / 9) + d + 1721013.5);
        
        // অ্যাডজাস্টমেন্ট (সঠিক করার জন্য l এর মান পরিবর্তন করা হয়েছে)
        let l = jd - 1948440 + 10629; 
        let n = Math.floor((l - 1) / 10631);
        l = l - 10631 * n + 354;
        let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
        l = l - (Math.floor((30 - j) / 20)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 21)) * (Math.floor((15238 * j) / 43)) + 29;
        
        let hMonth = Math.floor((24 * l) / 709);
        let hDay = l - Math.floor((709 * hMonth) / 24);
        let hYear = 30 * n + j - 30;

        const hijriMonthsBn = ["মুহররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জুমাদাল উলা", "জমাদিউস সানি", "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"];
        
        // মাস ইনডেক্স বাউন্ডারি চেক
        let mIdx = hMonth - 1;
        if(mIdx < 0) mIdx = 0;
        if(mIdx > 11) mIdx = 11;

        return `${toBn(hDay)} ${hijriMonthsBn[mIdx]}, ${toBn(hYear)}`;
      };

      const bngDate = getBengaliDate(now);
      const hijriDateFinal = getHijriDate(now);

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
