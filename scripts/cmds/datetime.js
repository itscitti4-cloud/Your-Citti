const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "clock",
    aliases: ["datetime", "time"],
    version: "14.0",
    author: "AkHi",
    category: "utility",
    role: 0,
    guide:           
          "{pn} to see time.\n" +
          "Adjustment: {pn} [type] [+/- offset]\n" +
          "Manual Set: {pn} set [type] DD-MM-YYYY\n\n" +
          "Examples:\n" +
          "1. !clock hijri +1\n" +
          "2. !clock set bangla 19-09-1432\n" +
          "3. !clock set english 03-01-2026\n" +
          "4. !clock set hijri 14-07-1447",
  },

  onStart: async function ({ message, args, threadsData, event }) {
    try {
      const { threadID } = event;
      const timezone = "Asia/Dhaka";
      
      let threadSettings = await threadsData.get(threadID) || {};
      let offsets = threadSettings.clockOffsets || { bangla: 0, hijri: 0, english: 0 };

      // --- সংখ্যা থেকে বাংলা সংখ্যা রূপান্তরকারী ---
      const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
      
      // --- বাংলা তারিখের বিভক্তি (Suffix) ---
      const getBngSuffix = (n) => {
        const suffixes = {
          1: "লা", 2: "রা", 3: "রা", 4: "ঠা",
          5: "ই", 6: "ই", 7: "ই", 8: "ই", 9: "ই", 10: "ই",
          11: "ই", 12: "ই", 13: "ই", 14: "ই", 15: "ই", 16: "ই", 17: "ই", 18: "ই", 19: "ই",
          20: "শে", 21: "শে", 22: "শে", 23: "শে", 24: "শে", 25: "শে", 26: "শে", 27: "শে", 28: "শে", 29: "শে", 30: "শে", 31: "শে"
        };
        return suffixes[n] || "";
      };

      // --- ম্যানুয়ালি তারিখ সেট করার লজিক (DD-MM-YYYY) ---
      if (args[0] === "set") {
        const type = args[1]?.toLowerCase();
        const inputDate = args[2];

        if (!type || !inputDate) {
          return message.reply("⚠️ Wrong Format, ex: !clock set hijri 14-07-1447");
        }

        const dateParts = inputDate.split("-");
        if (dateParts.length !== 3) return message.reply("⚠️ Wrong format, ex: DD-MM-YYYY");

        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);

        if (type === "english") {
          const newDate = moment.tz(`${year}-${month}-${day}`, "YYYY-MM-DD", timezone);
          if (!newDate.isValid()) return message.reply("⚠️ Wrong input English date!");
          offsets.english = newDate.diff(moment().tz(timezone).startOf('day'), 'days');
        } 
        else if (type === "bangla") {
          // বাংলা ক্যালকুলেশনে ইংরেজি তারিখের রেফারেন্স সেট করা হয় (৩রা জানুয়ারি ২০২৬ = ১৯শে পৌষ ১৪৩২)
          const refDate = moment.tz(`${year + 593}-${month}-${day}`, "YYYY-MM-DD", timezone);
          offsets.bangla = refDate.diff(moment().tz(timezone).startOf('day'), 'days');
        }
        else if (type === "hijri") {
          // হিজরী তারিখের জন্য রিলেটিভ অফসেট সেট
          const refDate = moment.tz(`2026-01-03`, "YYYY-MM-DD", timezone); 
          offsets.hijri = refDate.diff(moment().tz(timezone).startOf('day'), 'days');
        }

        await threadsData.set(threadID, { clockOffsets: offsets }, "data");
        return message.reply(`✅ ${type} Date set Successfully!`);
      }

      // --- রিলেটিভ অফসেট পরিবর্তন (+/-) ---
      if (args[0] === "hijri" || args[0] === "bangla" || args[0] === "english") {
        const type = args[0];
        const value = parseInt(args[1]);
        if (isNaN(value)) return message.reply(`⚠️ Please enter the correct format. ex: !clock hijri +1`);

        offsets[type] = (offsets[type] || 0) + value;
        await threadsData.set(threadID, { clockOffsets: offsets }, "data");
        return message.reply(`✅ ${type} Date ${value > 0 ? "+" + value : value} Day adjust Successfully`);
      }

      // --- সময় ও ইংরেজি তারিখ (ইংরেজি সংখ্যায়) ---
      let nowEng = moment().tz(timezone).add(offsets.english || 0, 'days');
      const timeStr = moment().tz(timezone).format("hh:mm A");
      const dayStr = nowEng.format("dddd");
      const engDate = nowEng.format("DD MMMM, YYYY");

      // --- বাংলা তারিখ ফাংশন (বাংলা সংখ্যা ও অক্ষরে) ---
      const getBengaliDate = (mDate) => {
        let targetDate = moment(mDate).add(offsets.bangla || 0, 'days');
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
        const bDay = totalDays + 1;
        return `${toBn(bDay)}${getBngSuffix(bDay)} ${months[mIndex]}, ${toBn(bYear)}`;
      };

      // --- হিজরী তারিখ ফাংশন (বাংলা সংখ্যা ও অক্ষরে) ---
      const getHijriDate = (mDate) => {
        let targetDate = moment(mDate).add(offsets.hijri || 0, 'days');
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
        return `${toBn(hDay)}${getBngSuffix(hDay)} ${hijriMonthsBn[hMonth - 1] || "রজব"}, ${toBn(hYear)}`;
      };

      const bngDateFinal = getBengaliDate(nowEng);
      const hijriDateFinal = getHijriDate(nowEng);

      const premiumReply = 
        `»—☀️— **𝐓𝐈𝐌𝐄 𝐃𝐄𝐓𝐀𝐈𝐋𝐒** —☀️—«\n\n` +
        ` ➤ 𝐓𝐢𝐦𝐞: ${timeStr}\n` +
        ` ➤ 𝐃𝐚𝐲: ${dayStr}\n\n` +
        ` ➤ 𝐃𝐚𝐭𝐞: ${engDate}\n` +
        ` ➤ বাংলা: ${bngDateFinal}\n` +
        ` ➤ হিজরী: ${hijriDateFinal}\n\n` +
        `»——— @Lubna Jannat ———«`;

      return message.reply(premiumReply);

    } catch (error) {
      console.error(error);
      message.reply("⚠️ Please type the correct format");
    }
  }
};
          
