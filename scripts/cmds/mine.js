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

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    // ১. ডাটা চেক এবং বেট অ্যামাউন্ট নির্ধারণ
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

    // ২. গেম লজিক (৫টি স্লটের মধ্যে ১টিতে বোমা থাকবে)
    const items = ["💎", "💎", "💣", "💎", "💎"];
    const randomResult = items[Math.floor(Math.random() * items.length)];

    api.sendMessage("⛏️ Digging into the mines...", threadID, messageID);

    // ৩. ফলাফল প্রসেসিং
    setTimeout(async () => {
      if (randomResult === "💣") {
        const lostMoney = betAmount;
        await usersData.set(senderID, { money: userMoney - lostMoney });
        
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
        await usersData.set(senderID, { money: userMoney + winMoney });

        return api.sendMessage(
          `╭──✦ [ 𝗠𝗜𝗡𝗘 𝗦𝗨𝗖𝗖𝗘𝗦𝗦 ]\n` +
          `├‣ Result: 💎 DIAMOND!\n` +
          `├‣ Status: Safe and Wealthy!\n` +
          `├‣ Profit: +$${winMoney}\n` +
          `╰‣ Balance: $${userMoney + winMoney} 📈`,
          threadID,
          messageID
        ); // এখানে ব্র্যাকেট ক্লোজ করা হয়েছে
      }
    }, 2000); // setTimeout এর ক্লোজিং নিশ্চিত করা হয়েছে
  } // onStart এর ক্লোজিং
}; // module.exports এর ক্লোজিং
  
