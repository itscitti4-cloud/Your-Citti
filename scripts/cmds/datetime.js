const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "clock",
    aliases: ["datetime", "time"],
    version: "14.5",
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

      const toBn = (n) => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
      
      const getBngSuffix = (n) => {
        const suffixes = {
          1: "লা", 2: "রা", 3: "রা", 4: "ঠা",
          5: "ই", 6: "ই", 7: "ই", 8: "ই", 9: "ই", 10: "ই",
          11: "ই", 12: "ই", 13: "ই", 14: "ই", 15: "ই", 16: "ই", 17: "ই", 18: "ই", 19: "শে",
          20: "শে", 21: "শে", 22: "শে", 23: "শে", 24: "শে", 25: "শে", 26: "শে", 27: "শে", 28: "শে", 29: "শে", 30: "শে", 31: "শে"
        };
        return suffixes[n] || "";
      };

      // --- ম্যানুয়ালি তারিখ সেট করার লজিক (Fix: Calculating Offset) ---
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

        const today = moment().tz(timezone).startOf('day');

        if (type === "english") {
          const newDate = moment.tz(`${year}-${month}-${day}`, "YYYY-MM-DD", timezone).startOf('day');
          if (!newDate.isValid()) return message.reply("⚠️ Wrong input English date!");
          offsets.english = newDate.diff(today, 'days');
        } 
        else if (type === "bangla") {
          // বাংলা সাল থেকে ইংরেজিতে কনভার্ট করে অফসেট বের করা
          const newDate = moment.tz(`${year + 593}-${month}-${day}`, "YYYY-MM-DD", timezone).startOf('day');
          if (!newDate.isValid()) return message.reply("⚠️ Wrong input Bangla date!");
          offsets.bangla = newDate.diff(today, 'days');
        }
        else if (type === "hijri") {
          // হিজরী তারিখ সেটের ক্ষেত্রে আমরা ঐ ইনপুট দিনটির জন্য অফসেট ক্যালকুলেট করি
          // যেহেতু হিজরী ক্যালকুলেশন অ্যালগরিদমিক, তাই সরাসরি অফসেট ইম্প্যাক্ট করবে
          const newDate = moment.tz(`${year + 579}-${month}-${day}`, "YYYY-MM-DD", timezone).startOf('day'); 
          offsets.hijri = newDate.diff(today, 'days');
        }

        await threadsData.set(threadID, { clockOffsets: offsets }, "data");
        return message.reply(`✅ ${type} Date set Successfully!`);
      }

      // --- রিলেটিভ অফসেট পরিবর্তন লজিক (+/-) ---
      if (args[0] === "hijri" || args[0] === "bangla" || args[0] === "english") {
        const type = args[0];
        const value = parseInt(args[1]);
        if (isNaN(value)) return message.reply(`⚠️ Please enter the correct format. ex: !clock hijri +1`);

        offsets[type] = (offsets[type] || 0) + value;
        await threadsData.set(threadID, { clockOffsets: offsets }, "data");
        return message.reply(`✅ ${type} Date ${value > 0 ? "+" + value : value} Day adjust Successfully`);
      }

      // --- ফাইনাল ক্যালকুলেশন এবং ডিসপ্লে ---
      let nowBase = moment().tz(timezone);
      
      // ইংরেজি তারিখ
      let nowEng = moment(nowBase).add(offsets.english || 0, 'days');
      const timeStr = nowBase.format("hh:mm A"); // সময় রিয়েলটাইম
      const dayStr = nowEng.format("dddd");
      const engDate = nowEng.format("DD MMMM, YYYY");

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

      const getHijriDate = (mDate) => {
        let targetDate = moment(mDate).add(offsets.hijri || 0, 'days');
        const d = targetDate.date();
        const m = targetDate.month();
        const y = targetDate.year();
        let jd = Math.floor(367 * y - (7 * (y + Math.floor((m + 9) / 12))) / 4 + Math.floor((275 * (m + 1)) / 9) + d + 1721013.5);
        let l = jd - 1948440 + 10633; 
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

      const bngDateFinal = getBengaliDate(nowBase);
      const hijriDateFinal = getHijriDate(nowBase);

      const premiumReply = 
        `»—☀️— **𝐓𝐈𝐌𝐄 𝐃𝐄𝐓𝐀𝐈𝐋𝐒** —☀️—«\n\n` +
        ` ➤ 𝐓𝐢𝐦𝐞: ${timeStr}\n` +
        ` ➤ 𝐃𝐚𝐲: ${dayStr}\n\n` +
        ` ➤ 𝐃𝐚𝐭𝐞: ${engDate}\n` +
        ` ➤ বাংলা: ${bngDateFinal}\n` +
        ` ➤ হিজরী: ${hijriDateFinal}\n\n` +
        `»——— NAWAB & AKHI ———«`;

      return message.reply(premiumReply);

    } catch (error) {
      console.error(error);
      message.reply("⚠️ Please type the correct format");
    }
  }
};
