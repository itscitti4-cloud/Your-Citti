const axios = require("axios");

module.exports = {
  config: {
    name: "sicbo",
    aliases: ["dice", "sb"],
    version: "1.1",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Play Sicbo (Big/Small) with betting",
    category: "game",
    guide: "{pn} <big | small> <amount>"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    const reply = (text) => api.sendMessage(text, threadID, messageID);

    const formatMoney = (n) => {
      const num = Math.abs(n);
      if (num >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
      if (num >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
      if (num >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      if (num >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
      return n.toString();
    };

    if (args.length < 2) return reply("⚠️ [ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗨𝗦𝗔𝗚𝗘 ]\nCorrect format: !sicbo <big/small> <bet_amount>");

    const betChoice = args[0].toLowerCase();
    const betAmount = parseInt(args[1]);

    const userData = await usersData.get(senderID);
    if (!userData) return reply("❌ User data not found.");
    
    const userMoney = userData.money || 0;

    if (!["big", "small"].includes(betChoice)) return reply("❌ Bet on 'big' or 'small'.");
    if (isNaN(betAmount) || betAmount <= 0) return reply("❌ Invalid bet amount.");
    if (betAmount > userMoney) return reply(`❌ Insufficient funds!`);

    const dice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    const total = dice.reduce((a, b) => a + b, 0);
    const diceEmojis = dice.map(d => ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][d]).join(" ");
    
    let result = (total >= 4 && total <= 10) ? "small" : (total >= 11 && total <= 17) ? "big" : "triple";

    // --- ডাটাবেস স্ট্যাটাস আপডেট ---
    const stats = userData.data?.sicboStats || { totalWins: 0, totalPlays: 0 };
    stats.totalPlays += 1;

    if (betChoice === result) {
      stats.totalWins += 1; // জয় আপডেট
      const winMoney = betAmount;
      await usersData.set(senderID, { 
        money: userMoney + winMoney,
        data: { ...userData.data, sicboStats: stats }
      });
      
      return reply(`╭───✦ [ 𝗦𝗜𝗖𝗕𝗢 𝗥𝗘𝗦𝗨𝗟𝗧 ]\n├‣ 🎲 Dice: ${diceEmojis}\n├‣ 📊 Total: ${total}\n├‣ 🏆 Outcome: ${result.toUpperCase()}\n╰──────────────◊\n🎊 You won $${formatMoney(winMoney)}!`);
    } else {
      await usersData.set(senderID, { 
        money: userMoney - betAmount,
        data: { ...userData.data, sicboStats: stats }
      });
      
      return reply(`╭───✦ [ 𝗦𝗜𝗖𝗕𝗢 𝗥𝗘𝗦𝗨𝗟𝗧 ]\n├‣ 🎲 Dice: ${diceEmojis}\n├‣ 📊 Total: ${total}\n├‣ 📉 Outcome: ${result.toUpperCase()}\n╰──────────────◊\n💀 You lost $${formatMoney(betAmount)}.`);
    }
  }
};
