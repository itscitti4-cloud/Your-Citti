const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "clock",
    aliases: ["datetime", "time"],
    version: "11.0",
    author: "AkHi",
    category: "utility",
    role: 0,
    guide: "{pn} [type] [offset] (Example: {pn} hijri +1, {pn} bangla -1)",
  },

  onStart: async function ({ message, args, threadsData, event }) {
    try {
      const { threadID } = event;
      const timezone = "Asia/Dhaka";
      
      // ডাটাবেজ থেকে বর্তমান থ্রেডের অফসেট ডাটা নেওয়া
      const threadSettings = await threadsData.get(threadID) || {};
      const offsets = threadSettings.clockOffsets || { bangla: 0, hijri: 0 };

      // --- অফসেট পরিবর্তন লজিক ---
      if (args[0] === "hijri" || args[0] === "bangla") {
        const type = args[0];
        const value = parseInt(args[1]);

        if (isNaN(value)) {
          return message.reply(`⚠️ সঠিক সংখ্যা দিন। উদাহরণ: !clock ${type} +1 অথবা -1`);
        }

        // নতুন ভ্যালু আপডেট করা
        offsets[type] += value;
        
        // ডাটাবেজে সেভ করা
        await threadsData.set(threadID, { clockOffsets: offsets }, "data");
        
        return message.reply(`✅ ${type === "hijri" ? "হিজরী" : "বাংলা"} তারিখ ${value > 0 ? "+" + value : value} দিন অ্যাডজাস্ট করা হয়েছে।`);
      }

      // বর্তমান সময় নেওয়া
      let now = moment().tz(timezone);
      const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
      
      const timeStr = now.format("hh:mm A");
      const dayStr = now.format("dddd");
      const engDate = now.format("DD MMMM, YYYY");

      // ১. বাংলা তারিখ ক্যালকুলেশন
      const getBengaliDate = (mDate) => {
        // অফসেট সহ নতুন সময় তৈরি (সংশোধিত)
        let targetDate = moment(mDate).tz(timezone).add(offsets.bangla, 'days');
        
        const year = targetDate.year();
        const month = targetDate.month() + 1;
        const day = targetDate.date();

        let bYear = year - 593;
        const months = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, (isLeapYear ? 31 : 30)];

        if (month < 4 || (month === 4 && day < 14)) bYear -= 1;

        let startOfBengaliYear = moment.tz(`${year}-04-14`, "YYYY-MM-DD", timezone);
        if (targetDate.isBefore(startOfBengaliYear)) {
          startOfBengaliYear = moment.tz(`${year - 1}-04-14`, "YYYY-MM-DD", timezone);
        }

        let totalDays = targetDate.diff(startOfBengaliYear, 'days');
        let mIndex = 0;
        while (mIndex < 12 && totalDays >= monthDays[mIndex]) {
          totalDays -= monthDays[mIndex];
          mIndex++;
        }
        return `${toBn(totalDays + 1)} ${months[mIndex]}, ${toBn(bYear)}`;
      };

      // ২. হিজরি তারিখ ক্যালকুলেশন
      const getHijriDate = (mDate) => {
        // অফসেট সহ নতুন সময় তৈরি (সংশোধিত)
        let targetDate = moment(mDate).tz(timezone).add(offsets.hijri, 'days');
        
        const d = targetDate.date();
        const m = targetDate.month();
        const y = targetDate.year();

        let jd = Math.floor(367 * y - (7 * (y + Math.floor((m + 9) / 12))) / 4 + Math.floor((275 * (m + 1)) / 9) + d + 1721013.5);
        let l = jd - 1948440 + 10632; 
        let n = Math.floor((l - 1) / 10631);
        l = l - 10631 * n + 354;
        let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
        l = l - (Math.floor((30 - j) / 20)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 21)) * (Math.floor((15238 * j) / 43)) + 29;
        
        let hMonth = Math.floor((24 * l) / 709);
        let hDay = l - Math.floor((709 * hMonth) / 24);
        let hYear = 30 * n + j - 30;

        const hijriMonthsBn = ["মুহররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জুমাদাল উলা", "জমাদিউস সানি", "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"];
        return `${toBn(hDay)} ${hijriMonthsBn[hMonth - 1] || "রজব"}, ${toBn(hYear)}`;
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
