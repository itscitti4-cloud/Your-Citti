module.exports = {
  config: {
    name: "slot",
    version: "2.6",
    author: "AkHi",
    description: {
      role: 0,
      en: "Playing slot game",
    },
    category: "Game",
  },
  langs: {
    en: {
      invalid_amount: "• 𝙴𝚗𝚝𝚎𝚛 𝚊 𝚟𝚊𝚕𝚒𝚍 𝚊𝚖𝚘𝚞𝚗𝚝 𝚘𝚏 𝚖𝚘𝚗𝚎𝚢 𝚝𝚘 𝚙𝚕𝚊𝚢",
      not_enough_money: "• 𝙲𝚑𝚎𝚌𝚔 𝚢𝚘𝚞𝚛 𝚋𝚊𝚕𝚊𝚗𝚌𝚎 𝚒𝚏 𝚢𝚘𝚞 𝚑𝚊𝚟𝚎 𝚝𝚑𝚊𝚝 𝚊𝚖𝚘𝚞𝚗𝚝",
    },
  },
  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    let userData = await usersData.get(senderID);
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    if (amount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    if (!userData.data) userData.data = {};
    if (!userData.data.slotStats) {
      userData.data.slotStats = { win: 0, total: 0 };
    }

    const slots = ["💚", "🧡", "❤️", "💜", "💙", "💛"];
    const s = Array.from({ length: 5 }, () => slots[Math.floor(Math.random() * slots.length)]);

    const winnings = win(s[0], s[1], s[2], s[3], s[4], amount);
    
    const newMoney = userData.money + winnings;
    userData.data.slotStats.total += 1;
    if (winnings > 0) userData.data.slotStats.win += 1;

    await usersData.set(senderID, {
      money: newMoney,
      data: userData.data
    });

    // টাকার সংখ্যা ফরম্যাট করার ফাংশন (K, M, B, T)
    const formatMoney = (n) => {
      const num = Math.abs(n);
      if (num >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
      if (num >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
      if (num >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      if (num >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
      return n.toString();
    };

    const bold = (text) => text.toString().replace(/[A-Za-z0-9]/g, char => {
      const charCode = char.charCodeAt(0);
      if (charCode >= 65 && charCode <= 90) return String.fromCodePoint(0x1D5DA + charCode - 65);
      if (charCode >= 97 && charCode <= 122) return String.fromCodePoint(0x1D5F4 + charCode - 97);
      if (charCode >= 48 && charCode <= 57) return String.fromCodePoint(0x1D7CE + charCode - 48);
      return char;
    });

    const winRate = ((userData.data.slotStats.win / userData.data.slotStats.total) * 100).toFixed(1);
    const statsStr = `(${userData.data.slotStats.win}/${userData.data.slotStats.total})`;
    const status = winnings > 0 ? "𝚠𝚒𝚗" : "𝚕𝚘𝚜𝚝";
    
    // ফরম্যাট করা মান এখানে ব্যবহার করা হয়েছে
    let msg = `• ${userData.name}, 𝚢𝚘𝚞 ${status} $${formatMoney(Math.abs(winnings))}\n`;
    msg += `• 𝙶𝚊𝚖𝚎 𝚁𝚎𝚜𝚞𝚕𝚝𝚜: [ ${s[0]} | ${s[1]} | ${s[2]} | ${s[3]} | ${s[4]} ]\n`;
    msg += `🎯 𝚆𝚒𝚗 𝚁𝚊𝚝𝚎: ${bold(winRate + "%")} ${bold(statsStr)}`;

    return message.reply(msg);
  },
};

function win(s1, s2, s3, s4, s5, bet) {
  const slots = [s1, s2, s3, s4, s5];
  const unique = new Set(slots).size;
  if (unique === 1) return bet * 10;
  return Math.random() < 0.35 ? bet * (6 - unique) : -bet;
  }
  
