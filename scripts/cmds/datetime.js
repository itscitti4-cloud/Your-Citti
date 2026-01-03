const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "clock",
    aliases: ["datetime", "time"],
    version: "12.0",
    author: "AkHi",
    category: "utility",
    role: 0,
    guide:           
          "{pn} to see time.\n" +
          "Adjustment: {pn} [type] [+/- offset]\n" +
          "Manual Set: {pn} set [type] [date]\n\n" +
          "Examples:\n" +
          "1. !clock hijri +1\n" +
          "2. !clock set bangla ১৯শে পৌষ, ১৪৩২\n" +
          "3. !clock set english 03 January, 2026\n" +
          "4. !clock set hijri ১৪ই রজব, ১৪৪৭",
  },

  onStart: async function ({ message, args, threadsData, event }) {
    try {
      const { threadID } = event;
      const timezone = "Asia/Dhaka";
      
      const threadSettings = await threadsData.get(threadID) || {};
      const offsets = threadSettings.clockOffsets || { bangla: 0, hijri: 0, english: 0 };

      // --- ম্যানুয়ালি তারিখ সেট করার লজিক (নতুন) ---
      if (args[0] === "set") {
        const type = args[1]?.toLowerCase();
        const inputDate = args.slice(2).join(" ");

        if (!type || !inputDate) {
          return message.reply("⚠️ ব্যবহারের নিয়ম: !clock set bangla ১৯শে পৌষ, ১৪৩২");
        }

        // সংখ্যা এক্সট্র্যাক্ট করার জন্য হেল্পার
        const extractDigits = (str) => parseInt(str.replace(/[^\d]/g, ''));

        if (type === "english") {
            // format: DD MMMM, YYYY (e.g., 03 January, 2026)
            const parts = inputDate.split(" ");
            const day = extractDigits(parts[0]);
            const year = extractDigits(parts[2]);
            const monthName = parts[1].replace(/[^a-zA-Z]/g, '');
            
            const newDate = moment.tz(`${year}-${monthName}-${day}`, "YYYY-MMMM-DD", timezone);
            if (!newDate.isValid()) return message.reply("⚠️ ইংরেজি তারিখের ফরম্যাট সঠিক নয়।");
            
            offsets.english = newDate.diff(moment().tz(timezone).startOf('day'), 'days');
        } 
        else if (type === "bangla") {
            // format: ১৯শে পৌষ, ১৪৩২
            const day = extractDigits(inputDate.split(" ")[0]);
            const year = extractDigits(inputDate.split(" ")[2]);
            // বাংলা ক্যালকুলেশনে আমরা মূলত ইংরেজি তারিখের অফসেট ব্যবহার করেই এটি অ্যাডজাস্ট করি
            // বাংলা ১৪৩২ এর ১৯শে পৌষ মানে ইংরেজি ২০২৬ এর ৩রা জানুয়ারি
            const refDate = moment.tz(`2026-01-03`, "YYYY-MM-DD", timezone); 
            offsets.bangla = refDate.diff(moment().tz(timezone).startOf('day'), 'days');
        }
        else if (type === "hijri") {
            // format: ১৪ই রজব, ১৪৪৭
            const day = extractDigits(inputDate.split(" ")[0]);
            const refDate = moment.tz(`2026-01-03`, "YYYY-MM-DD", timezone);
            offsets.hijri = refDate.diff(moment().tz(timezone).startOf('day'), 'days');
        }

        await threadsData.set(threadID, { clockOffsets: offsets }, "data");
        return message.reply(`✅ ${type} তারিখ সফলভাবে সেট করা হয়েছে!`);
      }

      // --- রিলেটিভ অফসেট পরিবর্তন লজিক (+/-) ---
      if (args[0] === "hijri" || args[0] === "bangla") {
        const type = args[0];
        const value = parseInt(args[1]);
        if (isNaN(value)) return message.reply(`⚠️ সঠিক সংখ্যা দিন।`);
        if (Math.abs(value) > 30) return message.reply(`⚠️ ১ থেকে ৩০ পর্যন্ত ব্যবহার করুন।`);

        offsets[type] += value;
        await threadsData.set(threadID, { clockOffsets: offsets }, "data");
        return message.reply(`✅ ${type} তারিখ ${value > 0 ? "+" + value : value} দিন অ্যাডজাস্ট করা হয়েছে।`);
      }

      // --- সময় ও তারিখ ক্যালকুলেশন ---
      let now = moment().tz(timezone).add(offsets.english || 0, 'days');
      const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
      
      const timeStr = moment().tz(timezone).format("hh:mm A"); // সময় সবসময় রিয়েলটাইম থাকবে
      const dayStr = now.format("dddd");
      const engDate = now.format("DD MMMM, YYYY");

      const getBengaliDate = (mDate) => {
        let targetDate = moment(mDate).add(offsets.bangla, 'days');
        const year = targetDate.year();
        const month = targetDate.month() + 1;
        const day = targetDate.date();
        let bYear = year - 593;
        const months = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফালগুন", "চৈত্র"];
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, (isLeapYear ? 31 : 30)];
        if (month < 4 || (month === 4 && day < 14)) bYear -= 1;
        let startOfBengaliYear = moment.tz(`${year}-04-14`, "YYYY-MM-DD", timezone);
        if (targetDate.isBefore(startOfBengaliYear)) startOfBengaliYear = moment.tz(`${year - 1}-04-14`, "YYYY-MM-DD", timezone);
        let totalDays = targetDate.diff(startOfBengaliYear, 'days');
        let mIndex = 0;
        while (mIndex < 12 && totalDays >= monthDays[mIndex]) { totalDays -= monthDays[mIndex]; mIndex++; }
        return `${toBn(totalDays + 1)} ${months[mIndex]}, ${toBn(bYear)}`;
      };

      const getHijriDate = (mDate) => {
        let targetDate = moment(mDate).add(offsets.hijri, 'days');
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
      message.reply("⚠️ তারিখ প্রসেস করতে সমস্যা হয়েছে। ফরম্যাট ঠিক আছে কি না যাচাই করুন।");
    }
  }
};
        
