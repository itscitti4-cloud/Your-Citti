const axios = require("axios");

module.exports = {
  config: {
    name: "flag",
    version: "1.1",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Identify the country by its flag",
    longDescription: "Get 1000$ for correct answer, lose 1000$ for wrong answer.",
    category: "game",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, message, usersData }) {
    return await this.sendQuiz(api, event, message, usersData);
  },

  onReply: async function ({ api, event, message, Reply, usersData }) {
    const { senderID, body } = event;
    const { correctAnswer, author } = Reply;

    // Only the person who started the quiz can answer
    if (senderID !== author) {
      return message.reply("❌ This quiz is not for you! Start your own using !flag");
    }

    const userAnswer = body.trim().toUpperCase();
    const validOptions = ["A", "B", "C", "D"];

    if (!validOptions.includes(userAnswer)) {
      return message.reply("Please reply with A, B, C, or D.");
    }

    if (userAnswer === correctAnswer) {
      // Add 1000$
      const userData = await usersData.get(senderID);
      await usersData.set(senderID, { money: (userData.money || 0) + 1000 });

      await message.reply(`✅ Correct answer! You won 1000$.\nPreparing next quiz...`);
      
      // Auto send next quiz
      return await this.sendQuiz(api, event, message, usersData);
    } else {
      // Deduct 1000$
      const userData = await usersData.get(senderID);
      await usersData.set(senderID, { money: Math.max((userData.money || 0) - 1000, 0) });

      return message.reply(`❌ Wrong answer! The correct answer was ${correctAnswer}.\nYou lost 1000$. Game Over!`);
    }
  },

  sendQuiz: async function (api, event, message, usersData) {
    try {
      // Fetching all 250 countries/territories (covers all 196+ recognized countries)
      const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,flags");
      const countries = res.data;

      // Pick 4 random countries
      const shuffle = countries.sort(() => 0.5 - Math.random()).slice(0, 4);
      const correctCountry = shuffle[0];
      const optionsLetters = ["A", "B", "C", "D"];
      
      // Shuffle names for options
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
      console.error(e);
      return message.reply("❌ Error fetching quiz data. Please try again later.");
    }
  }
};
