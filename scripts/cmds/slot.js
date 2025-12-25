Module.exports = {
  config: {
    name: "slot",
    version: "2.0",
    author: "AkHi",
    description: {
      role: 0,
      en: "Playing slot game with real win-rate statistics",
    },
    category: "Game",
  },

  langs: {
    en: {
      invalid_amount: "Enter a valid amount of money to play",
      not_enough_money: "Check your balance if you have that amount",
      win_message: "𝚢𝚘𝚞 𝚠𝚘𝚗",
      lose_message: "𝚢𝚘𝚞 𝚕𝚘𝚜𝚝",
      jackpot_message: "𝙹𝙰𝙲𝙺𝙿𝙾𝚃!! 𝚢𝚘𝚞 𝚠𝚘𝚗",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    const userName = userData.name;
    
    // ডাটাবেস থেকে স্ট্যাটাস নেওয়া বা নতুন করে শুরু করা
    let stats = userData.data.slotStats || { totalPlays: 0, totalWins: 0 };
    
    let amountStr = args[0] ? args[0].toLowerCase() : "";
    let amount = 0;

    if (amountStr.endsWith('k')) amount = parseFloat(amountStr) * 1000;
    else if (amountStr.endsWith('m')) amount = parseFloat(amountStr) * 1000000;
    else if (amountStr.endsWith('b')) amount = parseFloat(amountStr) * 1000000000;
    else if (amountStr.endsWith('t')) amount = parseFloat(amountStr) * 1000000000000;
    else amount = parseInt(amountStr);

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    if (amount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    const slots = ["💚", "🧡", "❤️", "💜", "💙", "💛"];
    const s = Array.from({ length: 5 }, () => slots[Math.floor(Math.random() * slots.length)]);

    const winnings = calculateWinnings(s, amount);

    // স্ট্যাটিস্টিকস আপডেট করা
    stats.totalPlays += 1;
    if (winnings > 0) stats.totalWins += 1;

    // ডাটাবেসে সেভ করা
    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: { ...userData.data, slotStats: stats }
    });

    const msg = formatResult(userName, s, winnings, stats, getLang);
    return message.reply(msg);
  },
};

function formatNumber(num) {
  if (num < 1000) return num.toString();
  const units = ["K", "M", "B", "T"];
  let unitIndex = -1;
  let value = Math.abs(num);
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  return value.toFixed(1).replace(/\.0$/, "") + units[unitIndex];
}

function calculateWinnings(s, bet) {
  if (s.every(val => val === s[0])) {
    const multipliers = { "💚": 20, "💛": 15, "💙": 10 };
    return bet * (multipliers[s[0]] || 7);
  }
  const isWin = Math.random() < 0.40;
  if (isWin) {
    const uniqueCount = new Set(s).size;
    const matchedCount = (5 - uniqueCount) * 2;
    return bet * (matchedCount > 0 ? matchedCount : 2);
  }
  return -bet;
}

function formatResult(name, s, winnings, stats, getLang) {
  const formattedWinnings = formatNumber(Math.abs(winnings));
  const isJackpot = s.every(val => val === s[0]);
  
  const toBoldNum = (num) => {
    const dict = { '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗', '.': '.', '%': '%' };
    return String(num).split('').map(c => dict[c] || c).join('');
  };

  let statusText = winnings > 0 
    ? (isJackpot ? getLang("jackpot_message") : getLang("win_message")) 
    : getLang("lose_message");

  // উইন রেট ক্যালকুলেশন
  const winPercent = ((stats.totalWins / stats.totalPlays) * 100).toFixed(1);
  const ratePercent = toBoldNum(winPercent + "%");
  const rateRatio = toBoldNum(`${stats.totalWins}/${stats.totalPlays}`);

  const resultLine = `• ${name}, ${statusText} $${formattedWinnings}`;
  const slotLine = `• 𝙶𝚊𝚖𝚎 𝚁𝚎𝚜𝚞𝚕𝚝𝚜: [ ${s[0]} | ${s[1]} | ${s[2]} | ${s[3]} | ${s[4]} ]`;
  const winRateLine = `🎯 𝚆𝚒𝚗 𝚁𝚊𝚝𝚎: ${ratePercent} (${rateRatio})`;

  return `${resultLine}\n${slotLine}\n${winRateLine}`;
      }
      
