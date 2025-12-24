const fs = require("fs-extra");

module.exports = {
  config: {
    name: "crash",
    version: "2.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Bet and cash out before it crashes!",
    category: "game",
    guide: "{pn} [amount]"
  },

  onStart: async function ({ message, args, usersData }) {
    const { senderID, reply } = message;
    
    // ১. ব্যালেন্স চেক এবং ইনপুট ভ্যালিডেশন
    const userData = await usersData.get(senderID);
    let balance = userData.money;
    let betAmount = args[0] === "all" ? balance : parseInt(args[0]);

    if (isNaN(betAmount) || betAmount < 50) {
      return reply("❌ | Please enter a valid bet amount (Minimum: 50$).");
    }
    if (betAmount > balance) {
      return reply(`🚫 | You don't have enough money! Your balance: ${balance}$`);
    }

    await usersData.set(senderID, { money: balance - betAmount });

    // ২. গেম লজিক সেটিংস
    let multiplier = 1.0;
    const crashAt = (Math.random() * 5 + 1).toFixed(2); // ১.০০ থেকে ৬.০০ এর মধ্যে ক্রাশ হবে
    let isCashedOut = false;

    const gameMsg = await reply(
      `🚀 | **CRASH GAME STARTED**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 Bet Amount: ${betAmount}$\n` +
      `📈 Multiplier: 1.00x\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💬 Reply "stop" to cash out!`
    );

    // ৩. রিপ্লাই লিসেনার (Stop করার জন্য)
    global.GoatBot.onReply.set(gameMsg.messageID, {
      commandName: this.config.name,
      messageID: gameMsg.messageID,
      author: senderID,
      betAmount,
    });

    // ৪. এনিমেশন লুপ
    const interval = setInterval(async () => {
      multiplier = (parseFloat(multiplier) + 0.2).toFixed(2);

      // যদি ক্রাশ পয়েন্টে পৌঁছায়
      if (multiplier >= crashAt && !isCashedOut) {
        clearInterval(interval);
        global.GoatBot.onReply.delete(gameMsg.messageID);
        return message.editReply(
          `💥 | **BOOM! IT CRASHED**\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📉 Crashed at: ${multiplier}x\n` +
          `💸 You lost: ${betAmount}$\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          ` Better luck next time! 🍀`,
          gameMsg.messageID
        );
      }

      // গ্রাফ আপডেট (এনিমেশন)
      if (!isCashedOut) {
        message.editReply(
          `🚀 | **CRASHING SOON...**\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `💰 Bet Amount: ${betAmount}$\n` +
          `📈 Current: ${multiplier}x\n` +
          `💵 Potential Win: ${Math.floor(betAmount * multiplier)}$\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `💬 Reply "stop" to cash out!`,
          gameMsg.messageID
        );
      }
    }, 2000);

    // ৫. ক্যাশ আউট হ্যান্ডলার
    module.exports.onReply = async ({ message, Reply, usersData }) => {
      if (message.senderID !== Reply.author) return;
      if (message.body.toLowerCase() === "stop") {
        isCashedOut = true;
        clearInterval(interval);
        
        const winAmount = Math.floor(Reply.betAmount * multiplier);
        const currentData = await usersData.get(Reply.author);
        await usersData.set(Reply.author, { money: currentData.money + winAmount });

        global.GoatBot.onReply.delete(Reply.messageID);
        return message.reply(
          `💰 | **CASHED OUT SUCCESSFULLY!**\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🌟 Multiplier: ${multiplier}x\n` +
          `💵 You Won: ${winAmount}$\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `Congratulations! Your balance has been updated. ✨`
        );
      }
    };
  }
};

// টাকা বিয়োগ বা যোগ করার পর এভাবে সেভ করতে হয়
await usersData.set(userID, { 
    money: newBalance 
});
          
