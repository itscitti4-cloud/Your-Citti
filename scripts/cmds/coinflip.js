const axios = require("axios");

module.exports = {
  config: {
    name: "coinflip",
    aliases: ["cf", "flip"],
    version: "1.1",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Flip a coin and win/lose money (h/t)",
    category: "game",
    guide: "{pn} [h/t] [bet_amount]"
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

    const userData = await usersData.get(senderID);
    if (!userData) return reply("❌ | আপনার ডাটাবেস তথ্য খুঁজে পাওয়া যায়নি।");
    
    const balance = userData.money || 0;

    if (args.length < 2) {
      return reply(`✨ [ 𝗖𝗢𝗜𝗡𝗙𝗟𝗜𝗣 𝗚𝗨𝗜𝗗𝗘 ] ✨\n━━━━━━━━━━━━━\n💡 Usage: !coinflip [h/t] [bet_amount]\n📝 Example: !coinflip h 100\n(h = Heads, t = Tails)`);
    }

    const choice = args[0].toLowerCase();
    const betAmount = parseInt(args[1]);

    if (choice !== 'h' && choice !== 't') return reply("❌ | Please choose 'h' for Heads or 't' for Tails.");
    if (isNaN(betAmount) || betAmount <= 0) return reply("❌ | Please enter a valid bet amount.");
    if (betAmount > balance) return reply(`❌ | You don't have enough money!`);

    const coinResult = Math.random() < 0.5 ? 'h' : 't';
    const resultText = coinResult === 'h' ? 'HEADS' : 'TAILS';
    const resultEmoji = coinResult === 'h' ? '🌕' : '🌗';

    reply("🪙 | Spinning the coin...");

    setTimeout(async () => {
      // --- ডাটাবেস স্ট্যাটাস প্রিপারেশন ---
      const stats = userData.data?.coinflipStats || { totalWins: 0, totalPlays: 0 };
      stats.totalPlays += 1;

      if (choice === coinResult) {
        stats.totalWins += 1; // জয় আপডেট
        const winAmount = betAmount; 
        const finalBalance = balance + winAmount;

        await usersData.set(senderID, { 
          money: finalBalance, 
          data: { ...userData.data, coinflipStats: stats } 
        });
        
        return reply(`✨ [ 𝗖𝗢𝗜𝗡𝗙𝗟𝗜𝗣 𝗥𝗘𝗦𝗨𝗟𝗧 ] ✨\n━━━━━━━━━━━━━\n🎰 Result: ${resultEmoji} ${resultText}\n🎉 You won: +${formatMoney(winAmount)} coins`);
      } else {
        const finalBalance = balance - betAmount;

        await usersData.set(senderID, { 
          money: finalBalance, 
          data: { ...userData.data, coinflipStats: stats } 
        });
        
        return reply(`✨ [ 𝗖𝗢𝗜𝗡𝗙𝗟𝗜𝗣 𝗥𝗘𝗦𝗨𝗟𝗧 ] ✨\n━━━━━━━━━━━━━\n🎰 Result: ${resultEmoji} ${resultText}\n💀 You lost: -${formatMoney(betAmount)} coins`);
      }
    }, 2000);
  }
};
