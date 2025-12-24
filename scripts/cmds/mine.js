const fs = require("fs-extra");

module.exports = {
  config: {
    name: "mine",
    aliases: ["mines", "dig"],
    version: "1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Bet and find diamonds, avoid bombs!",
    category: "game",
    guide: "{pn} [bet_amount]"
  },

  onStart: async function ({ message, args, usersData }) {
    const { senderID, reply } = message;
    
    // ১. ডাটা চেক এবং বেট অ্যামাউন্ট নির্ধারণ
    const userData = await usersData.get(senderID);
    const userMoney = userData.money;
    const betAmount = parseInt(args[0]);

    if (isNaN(betAmount) || betAmount <= 0) {
      return reply("⚠️ Please enter a valid amount to bet!\nExample: !mine 500");
    }

    if (userMoney < betAmount) {
      return reply(`❌ You don't have enough money! Your current balance is $${userMoney}`);
    }

    // ২. গেম লজিক (৫টি স্লটের মধ্যে ১টিতে বোমা থাকবে)
    const items = ["💎", "💎", "💣", "💎", "💎"];
    const randomResult = items[Math.floor(Math.random() * items.length)];

    await reply("⛏️ Digging into the mines...");

    // ৩. ফলাফল প্রসেসিং
    setTimeout(async () => {
      if (randomResult === "💣") {
        const lostMoney = betAmount;
        await usersData.set(senderID, { money: userMoney - lostMoney });
        
        return reply(
          `╭──✦ [ 𝗠𝗜𝗡𝗘 𝗘𝗫𝗣𝗟𝗢𝗗𝗘𝗗 ]\n` +
          `├‣ Result: 💣 BOOM!\n` +
          `├‣ Status: You hit a bomb!\n` +
          `├‣ Loss: -$${lostMoney}\n` +
          `╰‣ Balance: $${userMoney - lostMoney} 📉`
        );
      } else {
        const winMoney = Math.floor(betAmount * 1.5);
        await usersData.set(senderID, { money: userMoney + winMoney });

        return reply(
          `╭──✦ [ 𝗠𝗜𝗡𝗘 𝗦𝗨𝗖𝗖𝗘𝗦𝗦 ]\n` +
          `├‣ Result: 💎 DIAMOND!\n` +
          `├‣ Status: Safe and Wealthy!\n` +
          `├‣ Profit: +$${winMoney}\n` +
          `╰‣ Balance: $${userMoney + winMoney} 📈`
        );
      }
    }, 2000); // ২ সেকেন্ড ডিলে যাতে গেমটি রিয়েলিস্টিক লাগে
  }
};
