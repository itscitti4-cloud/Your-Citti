module.exports = {
  config: {
    name: "slot",
    version: "1.6",
    author: "AkHi",
    description: {
      role: 0,
      en: "Playing slot game with short number formatting",
    },
    category: "Game",
  },

  langs: {
    en: {
      invalid_amount: "Enter a valid amount of money to play",
      not_enough_money: "Check your balance if you have that amount",
      win_message: "You won $%1!",
      lose_message: "You lost $%1!",
      jackpot_message: "JACKPOT!! You won $%1 for five %2 symbols!",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    
    // ইনপুট হ্যান্ডলিং (1k, 1m ইত্যাদি সাপোর্ট করার জন্য)
    let amount = args[0];
    if (amount && (amount.toLowerCase().endsWith('k') || amount.toLowerCase().endsWith('m') || amount.toLowerCase().endsWith('b') || amount.toLowerCase().endsWith('t'))) {
        const unit = amount.slice(-1).toLowerCase();
        const value = parseFloat(amount);
        if (unit === 'k') amount = value * 1000;
        else if (unit === 'm') amount = value * 1000000;
        else if (unit === 'b') amount = value * 1000000000;
        else if (unit === 't') amount = value * 1000000000000;
    } else {
        amount = parseInt(amount);
    }

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    if (amount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    const slots = ["💚", "🧡", "❤️", "💜", "💙", "💛"];
    const s1 = slots[Math.floor(Math.random() * slots.length)];
    const s2 = slots[Math.floor(Math.random() * slots.length)];
    const s3 = slots[Math.floor(Math.random() * slots.length)];
    const s4 = slots[Math.floor(Math.random() * slots.length)];
    const s5 = slots[Math.floor(Math.random() * slots.length)];

    const winnings = calculateWinnings(s1, s2, s3, s4, s5, amount);

    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: userData.data,
    });

    const msg = formatResult(s1, s2, s3, s4, s5, winnings, getLang);
    return message.reply(msg);
  },
};

// সংখ্যাকে K, M, B, T তে কনভার্ট করার ফাংশন
function formatNumber(num) {
  if (num < 1000) return num.toString();
  const units = ["K", "M", "B", "T"];
  let unitIndex = -1;
  let value = Math.abs(num);

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  return (num < 0 ? "-" : "") + value.toFixed(2).replace(/\.00$/, "") + units[unitIndex];
}

function calculateWinnings(s1, s2, s3, s4, s5, bet) {
  if (s1 === s2 && s2 === s3 && s3 === s4 && s4 === s5) {
    if (s1 === "💚") return bet * 20;
    if (s1 === "💛") return bet * 15;
    if (s1 === "💙") return bet * 10;
    return bet * 7;
  }

  const isWin = Math.random() < 0.45; // জয়ের সম্ভাবনা ৪৫%
  if (isWin) {
    const unique = new Set([s1, s2, s3, s4, s5]);
    const matchedCount = (5 - unique.size) * 2;
    return bet * (matchedCount > 0 ? matchedCount : 2);
  } else {
    return -bet;
  }
}

function formatResult(s1, s2, s3, s4, s5, winnings, getLang) {
  const bold = (text) =>
    text
      .replace(/[A-Z]/gi, (c) =>
        String.fromCodePoint(c.charCodeAt(0) + (c >= "a" ? 119737 - 97 : 119743 - 65))
      )
      .replace(/\d/g, (d) => String.fromCodePoint(0x1d7ce + parseInt(d)));

  const slotLine = `🎰 [ ${s1} | ${s2} | ${s3} | ${s4} | ${s5} ] 🎰`;
  const formattedWinnings = formatNumber(Math.abs(winnings));

  if (winnings > 0) {
    const isJackpot = s1 === s2 && s2 === s3 && s3 === s4 && s4 === s5;
    const text = isJackpot 
      ? getLang("jackpot_message", formattedWinnings, s1) 
      : getLang("win_message", formattedWinnings);
    return `${bold(slotLine)}\n${bold(text)}`;
  } else {
    return `${bold(slotLine)}\n${bold(getLang("lose_message", formattedWinnings))}`;
  }
}
