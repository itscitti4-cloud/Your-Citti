const fs = require("fs-extra");

module.exports = {
  config: {
    name: "mine",
    aliases: ["mines", "dig"],
    version: "1.1",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Bet and find diamonds, avoid bombs!",
    category: "game",
    guide: "{pn} [bet_amount]"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    const userData = await usersData.get(senderID);
    if (!userData) return api.sendMessage("❌ User data not found.", threadID, messageID);

    const userMoney = userData.money || 0;
    const betAmount = parseInt(args[0]);

    if (isNaN(betAmount) || betAmount <= 0) {
      return api.sendMessage("⚠️ Please enter a valid amount to bet!\nExample: !mine 500", threadID, messageID);
    }

    if (userMoney < betAmount) {
      return api.sendMessage(`❌ You don't have enough money! Your current balance is $${userMoney}`, threadID, messageID);
    }

    const items = ["💎", "💎", "💣", "💎", "💎"];
    const randomResult = items[Math.floor(Math.random() * items.length)];

    api.sendMessage("⛏️ Digging into the mines...", threadID, messageID);

    setTimeout(async () => {
      // --- ডাটাবেস স্ট্যাটাস প্রিপারেশন ---
      const stats = userData.data?.mineStats || { totalWins: 0, totalPlays: 0 };
      stats.totalPlays += 1;

      if (randomResult === "💣") {
        const lostMoney = betAmount;
        // হারলে শুধু টাকা কমবে এবং খেলার সংখ্যা বাড়বে
        await usersData.set(senderID, { 
          money: userMoney - lostMoney,
          data: { ...userData.data, mineStats: stats }
        });
        
        return api.sendMessage(
          `╭──✦ [ 𝗠𝗜𝗡𝗘 𝗘𝗫𝗣𝗟𝗢𝗗𝗘𝗗 ]\n` +
          `├‣ Result: 💣 BOOM!\n` +
          `├‣ Status: You hit a bomb!\n` +
          `├‣ Loss: -$${lostMoney}\n` +
          `╰‣ Balance: $${userMoney - lostMoney} 📉`,
          threadID,
          messageID
        );
      } else {
        const winMoney = Math.floor(betAmount * 0.5); 
        stats.totalWins += 1; // জয় আপডেট
        
        // জিতলে টাকা বাড়বে এবং জয়ের সংখ্যা বাড়বে
        await usersData.set(senderID, { 
          money: userMoney + winMoney,
          data: { ...userData.data, mineStats: stats }
        });

        return api.sendMessage(
          `╭──✦ [ 𝗠𝗜𝗡𝗘 𝗦𝗨𝗖𝗖𝗘𝗦𝗦 ]\n` +
          `├‣ Result: 💎 DIAMOND!\n` +
          `├‣ Status: Safe and Wealthy!\n` +
          `├‣ Profit: +$${winMoney}\n` +
          `╰‣ Balance: $${userMoney + winMoney} 📈`,
          threadID,
          messageID
        );
      }
    }, 2000);
  }
};
