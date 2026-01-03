const axios = require("axios");

module.exports = {
  config: {
    name: "flag",
    version: "1.2",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Identify the country by its flag",
    category: "game",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, message, usersData }) {
    return await this.sendQuiz(api, event, message, usersData);
  },

  onReply: async function ({ api, event, message, Reply, usersData }) {
    const { senderID, body } = event;
    const { correctAnswer, author } = Reply;

    if (senderID !== author) {
      return message.reply("❌ This quiz is not for you!");
    }

    const userAnswer = body.trim().toUpperCase();
    const validOptions = ["A", "B", "C", "D"];

    if (!validOptions.includes(userAnswer)) {
      return message.reply("Please reply with A, B, C, or D.");
    }

    const userData = await usersData.get(senderID);
    const stats = userData.data?.flagStats || { totalWins: 0, totalPlays: 0 };
    stats.totalPlays += 1; // মোট খেলার সংখ্যা বৃদ্ধি

    if (userAnswer === correctAnswer) {
      stats.totalWins += 1; // জয়ের সংখ্যা বৃদ্ধি
      
      await usersData.set(senderID, { 
        money: (userData.money || 0) + 1000,
        data: { ...userData.data, flagStats: stats } // ডাটাবেসে সেভ
      });

      await message.reply(`✅ Correct answer! You won 1000$.\nPreparing next quiz...`);
      return await this.sendQuiz(api, event, message, usersData);
    } else {
      await usersData.set(senderID, { 
        money: Math.max((userData.money || 0) - 1000, 0),
        data: { ...userData.data, flagStats: stats } // হারলেও খেলার সংখ্যা সেভ হবে
      });

      return message.reply(`❌ Wrong answer! The correct answer was ${correctAnswer}.\nYou lost 1000$. Game Over!`);
    }
  },

  sendQuiz: async function (api, event, message, usersData) {
    try {
      const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,flags");
      const countries = res.data;
      // সঠিক উত্তরের শেষে ডট (.) যোগ করা
      const finalOptions = options.map(opt => opt === correctAnswer ? opt + "." : opt);

      const shuffle = countries.sort(() => 0.5 - Math.random()).slice(0, 4);
      const correctCountry = shuffle[0];
      const optionsLetters = ["A", "B", "C", "D"];
      
      const shuffledNames = shuffle
        .map(c => c.name.common)
        .sort(() => 0.5 - Math.random());

      const correctIndex = shuffledNames.indexOf(correctCountry.name.common);
      const correctLetter = optionsLetters[correctIndex];

      let msg = "🚩 Guess the country:\n\n";
      shuffledNames.forEach((name, i) => {
        msg += `${optionsLetters[i]}. ${name}\n`;
      });
      msg += "\nReply with A, B, C, or D to answer.";

      return message.reply({
        body: msg,
        attachment: await global.utils.getStreamFromURL(correctCountry.flags.png)
      }, (err, info) => {
        if (err) return console.error(err);
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          correctAnswer: correctLetter
        });
      });
    } catch (e) {
      return message.reply("❌ Error fetching quiz data.");
    }
  }
};
