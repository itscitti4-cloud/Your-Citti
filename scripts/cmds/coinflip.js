module.exports = {
  config: {
    name: "coinflip",
    aliases: ["cf", "flip"],
    version: "1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Flip a coin and win/lose money (h/t)",
    longDescription: "Bet your money on heads (h) or tails (t). Double or nothing!",
    category: "game",
    guide: "{pn} [haids/tails] [bet_amount]"
  },

  onStart: async function ({ message, args, usersData }) {
    const { senderID, reply } = message;
    const userData = await usersData.get(senderID);
    const balance = userData.money;

    // ১. ইনপুট চেক
    if (args.length < 2) {
      return reply(`✨ [ 𝗖𝗢𝗜𝗡𝗙𝗟𝗜𝗣 𝗚𝗨𝗜𝗗𝗘 ] ✨\n━━━━━━━━━━━━━\n💡 Usage: !coinflip [h/t] [bet_amount]\n📝 Example: !coinflip h 100\n(h = Heads, t = Tails)`);
    }

    const choice = args[0].toLowerCase();
    const betAmount = parseInt(args[1]);

    if (choice !== 'h' && choice !== 't') {
      return reply("❌ | Please choose 'h' for Heads or 't' for Tails.");
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      return reply("❌ | Please enter a valid bet amount.");
    }

    if (betAmount > balance) {
      return reply(`❌ | You don't have enough money! Your balance: ${balance} coins.`);
    }

    // ২. গেম লজিক
    const coinResult = Math.random() < 0.5 ? 'h' : 't';
    const resultText = coinResult === 'h' ? 'HEADS' : 'TAILS';
    const resultEmoji = coinResult === 'h' ? '🌕' : '🌗';

    reply("🪙 | Spinning the coin...").then(async (info) => {
      // একটু বাস্তবসম্মত ফিল দেওয়ার জন্য ৩ সেকেন্ড ওয়েট
      setTimeout(async () => {
        if (choice === coinResult) {
          // জয়ী হলে
          const winAmount = betAmount; // ১ গুণ লাভ (টোটাল ২ গুণ)
          await usersData.set(senderID, { money: balance + winAmount });
          
          return reply(
            `✨ [ 𝗖𝗢𝗜𝗡𝗙𝗟𝗜𝗣 𝗥𝗘𝗦𝗨𝗟𝗧 ] ✨\n` +
            `━━━━━━━━━━━━━\n` +
            `🎰 Result: ${resultEmoji} ${resultText}\n` +
            `👤 Your Choice: ${choice === 'h' ? 'Heads' : 'Tails'}\n\n` +
            `🎉 𝗖𝗢𝗡𝗚𝗥𝗔𝗧𝗨𝗟𝗔𝗧𝗜𝗢𝗡𝗦!\n` +
            `💰 You won: +${winAmount} coins\n` +
            `🏦 New Balance: ${balance + winAmount} coins`
          );
        } else {
          // হেরে গেলে
          await usersData.set(senderID, { money: balance - betAmount });
          
          return reply(
            `✨ [ 𝗖𝗢𝗜𝗡𝗙𝗟𝗜𝗣 𝗥𝗘𝗦𝗨𝗟𝗧 ] ✨\n` +
            `━━━━━━━━━━━━━\n` +
            `🎰 Result: ${resultEmoji} ${resultText}\n` +
            `👤 Your Choice: ${choice === 'h' ? 'Heads' : 'Tails'}\n\n` +
            `💀 𝗕𝗘𝗧𝗧𝗘𝗥 𝗟𝗨𝗖𝗞 𝗡𝗘𝗫𝗧 𝗧𝗜𝗠𝗘!\n` +
            `📉 You lost: -${betAmount} coins\n` +
            `🏦 New Balance: ${balance - betAmount} coins`
          );
        }
      }, 2000);
    });
  }
};
                                           
