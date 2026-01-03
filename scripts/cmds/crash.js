const fs = require("fs-extra");

module.exports = {
  config: {
    name: "crash",
    version: "2.1",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Bet and cash out before it crashes!",
    category: "game",
    guide: "{pn} [amount]"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    const userData = await usersData.get(senderID);
    if (!userData) return api.sendMessage("❌ | ইউজার ডাটা পাওয়া যায়নি।", threadID, messageID);

    let balance = userData.money || 0;
    let betAmount = args[0] === "all" ? balance : parseInt(args[0]);

    if (isNaN(betAmount) || betAmount < 50) {
      return api.sendMessage("❌ | Please enter a valid bet amount (Minimum: 50$).", threadID, messageID);
    }
    if (betAmount > balance) {
      return api.sendMessage(`🚫 | You don't have enough money! Your balance: ${balance}$`, threadID, messageID);
    }

    // বাজি ধরার টাকা কেটে নেওয়া
    await usersData.set(senderID, { money: balance - betAmount });

    let multiplier = 1.0;
    const crashAt = (Math.random() * 5 + 1.1).toFixed(2);
    
    const gameMsg = await api.sendMessage(
      `🚀 | **CRASH GAME STARTED**\n━━━━━━━━━━━━━━━━━━\n💰 Bet Amount: ${betAmount}$\n📈 Multiplier: 1.00x\n━━━━━━━━━━━━━━━━━━\n💬 Reply "stop" to cash out!`,
      threadID
    );

    global.GoatBot.onReply.set(gameMsg.messageID, {
      commandName: this.config.name,
      messageID: gameMsg.messageID,
      author: senderID,
      betAmount,
      multiplier,
      crashAt,
      isCashedOut: false
    });

    const interval = setInterval(async () => {
      const currentData = global.GoatBot.onReply.get(gameMsg.messageID);
      if (!currentData || currentData.isCashedOut) {
        clearInterval(interval);
        return;
      }

      multiplier = (parseFloat(multiplier) + 0.3).toFixed(2);
      currentData.multiplier = multiplier;

      if (multiplier >= crashAt) {
        clearInterval(interval);
        
        // --- হারলে ডাটা আপডেট ---
        const stats = userData.data?.crashStats || { totalWins: 0, totalPlays: 0 };
        stats.totalPlays += 1;
        await usersData.set(senderID, { data: { ...userData.data, crashStats: stats } });
        
        global.GoatBot.onReply.delete(gameMsg.messageID);
        return api.editMessage(
          `💥 | **BOOM! IT CRASHED**\n━━━━━━━━━━━━━━━━━━\n📉 Crashed at: ${multiplier}x\n💸 You lost: ${betAmount}$\n━━━━━━━━━━━━━━━━━━\n Better luck next time! 🍀`,
          gameMsg.messageID
        );
      }

      api.editMessage(
        `🚀 | **CRASHING SOON...**\n━━━━━━━━━━━━━━━━━━\n💰 Bet Amount: ${betAmount}$\n📈 Current: ${multiplier}x\n💵 Potential Win: ${Math.floor(betAmount * multiplier)}$\n━━━━━━━━━━━━━━━━━━\n💬 Reply "stop" to cash out!`,
        gameMsg.messageID
      );
    }, 2500);
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { senderID, body, threadID, messageID } = event;
    if (senderID !== Reply.author) return;

    if (body.toLowerCase() === "stop") {
      const currentData = global.GoatBot.onReply.get(Reply.messageID);
      if (!currentData || currentData.isCashedOut) return;

      currentData.isCashedOut = true;
      const finalMultiplier = currentData.multiplier;
      const winAmount = Math.floor(Reply.betAmount * finalMultiplier);

      const userData = await usersData.get(senderID);
      
      // --- জিতলে ডাটা আপডেট ---
      const stats = userData.data?.crashStats || { totalWins: 0, totalPlays: 0 };
      stats.totalPlays += 1;
      stats.totalWins += 1;

      await usersData.set(senderID, { 
        money: (userData.money || 0) + winAmount,
        data: { ...userData.data, crashStats: stats } // ডাটা সেভ হচ্ছে
      });

      global.GoatBot.onReply.delete(Reply.messageID);

      return api.sendMessage(
        `💰 | **CASHED OUT SUCCESSFULLY!**\n━━━━━━━━━━━━━━━━━━\n🌟 Multiplier: ${finalMultiplier}x\n💵 You Won: ${winAmount}$\n━━━━━━━━━━━━━━━━━━\nCongratulations!`,
        threadID,
        messageID
      );
    }
  }
};
  
