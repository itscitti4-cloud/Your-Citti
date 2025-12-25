const axios = require("axios");

module.exports = {
  config: {
    name: "sicbo",
    aliases: ["dice", "sb"],
    version: "1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Play Sicbo (Big/Small) with betting",
    longDescription: "Bet on Small (4-10) or Big (11-17) using your balance.",
    category: "game",
    guide: "{pn} <big | small> <amount>"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    
    const reply = (text) => api.sendMessage(text, threadID, messageID);

    // টাকার সংখ্যা ফরম্যাট করার ফাংশন
    const formatMoney = (n) => {
      const num = Math.abs(n);
      if (num >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
      if (num >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
      if (num >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      if (num >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
      return n.toString();
    };

    if (args.length < 2) {
      return reply("⚠️ [ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗨𝗦𝗔𝗚𝗘 ]\nCorrect format: !sicbo <big/small> <bet_amount>");
    }

    const betChoice = args[0].toLowerCase();
    const betAmount = parseInt(args[1]);

    const userData = await usersData.get(senderID);
    if (!userData) return reply("❌ [ 𝗘𝗥𝗥𝗢𝗥 ]\nUser data not found in database.");
    
    const userMoney = userData.money || 0;

    if (!["big", "small"].includes(betChoice)) {
      return reply("❌ [ 𝗘𝗥𝗥𝗢𝗥 ]\nYou can only bet on 'big' or 'small'.");
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      return reply("❌ [ 𝗘𝗥𝗥𝗢𝗥 ]\nPlease enter a valid bet amount.");
    }

    if (betAmount > userMoney) {
      return reply(`❌ [ 𝗜𝗡𝗦𝗨𝗙𝗙𝗜𝗖𝗜𝗘𝗡𝗧 𝗙𝗨𝗡𝗗𝗦 ]\nYou only have $${formatMoney(userMoney)} in your wallet.`);
    }

    const dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    const total = dice.reduce((a, b) => a + b, 0);
    const diceEmojis = dice.map(d => ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][d]).join(" ");
    
    let result = "";
    if (total >= 4 && total <= 10) result = "small";
    else if (total >= 11 && total <= 17) result = "big";
    else result = "triple";

    const isWin = betChoice === result;
    
    if (isWin) {
      const winMoney = betAmount;
      const finalBalance = userMoney + winMoney;
      await usersData.set(senderID, { money: finalBalance });
      
      return reply(
        `╭───✦ [ 𝗦𝗜𝗖𝗕𝗢 𝗥𝗘𝗦𝗨𝗟𝗧 ]\n` +
        `├‣ 🎲 Dice: ${diceEmojis}\n` +
        `├‣ 📊 Total: ${total}\n` +
        `├‣ 🏆 Outcome: ${result.toUpperCase()}\n` +
        `╰──────────────◊\n\n` +
        `🎊 [ 𝗖𝗢𝗡𝗚𝗥𝗔𝗧𝗨𝗟𝗔𝗧𝗜𝗢𝗡𝗦 ]\n` +
        `You won $${formatMoney(winMoney)}!\n` +
        `💰 Current Balance: $${formatMoney(finalBalance)}`
      );
    } else {
      const finalBalance = userMoney - betAmount;
      await usersData.set(senderID, { money: finalBalance });
      
      return reply(
        `╭───✦ [ 𝗦𝗜𝗖𝗕𝗢 𝗥𝗘𝗦𝗨𝗟𝗧 ]\n` +
        `├‣ 🎲 Dice: ${diceEmojis}\n` +
        `├‣ 📊 Total: ${total}\n` +
        `├‣ 📉 Outcome: ${result.toUpperCase()}\n` +
        `╰──────────────◊\n\n` +
        `💀 [ 𝗬𝗢𝗨 𝗟𝗢𝗦𝗧 ]\n` +
        `Better luck next time! You lost $${formatMoney(betAmount)}.\n` +
        `💰 Current Balance: $${formatMoney(finalBalance)}`
      );
    }
  }
};
