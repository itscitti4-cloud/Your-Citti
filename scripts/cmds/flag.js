const axios = require("axios");

module.exports = {
  config: {
    name: "flag",
    version: "1.3",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Identify the country by its flag",
    category: "game",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    return await this.sendQuiz(api, event, usersData);
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { senderID, body, threadID, messageID } = event;
    const { correctAnswer, author } = Reply;

    if (senderID !== author) {
      return api.sendMessage("❌ This quiz is not for you!", threadID, messageID);
    }

    const userAnswer = body.trim().toUpperCase();
    const validOptions = ["A", "B", "C", "D"];

    if (!validOptions.includes(userAnswer)) {
      return api.sendMessage("Please reply with A, B, C, or D.", threadID, messageID);
    }

    const userData = await usersData.get(senderID);
    const stats = userData.data?.flagStats || { totalWins: 0, totalPlays: 0 };
    stats.totalPlays += 1;

    if (userAnswer === correctAnswer) {
      stats.totalWins += 1;
      
      await usersData.set(senderID, { 
        money: (userData.money || 0) + 1000,
        data: { ...userData.data, flagStats: stats }
      });

      await api.sendMessage(`✅ Correct answer! You won 1000$.\nPreparing next quiz...`, threadID, messageID);
      return await this.sendQuiz(api, event, usersData);
    } else {
      await usersData.set(senderID, { 
        money: Math.max((userData.money || 0) - 1000, 0),
        data: { ...userData.data, flagStats: stats }
      });

      return api.sendMessage(`❌ Wrong answer! The correct answer was ${correctAnswer}.\nYou lost 1000$. Game Over!`, threadID, messageID);
    }
  },

  sendQuiz: async function (api, event, usersData) {
    const { threadID, senderID } = event;
    try {
      const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,flags");
      const countries = res.data;

      // ৪টি দেশ র‍্যান্ডমলি নেওয়া
      const shuffle = countries.sort(() => 0.5 - Math.random()).slice(0, 4);
      const correctCountry = shuffle[0];
      const correctName = correctCountry.name.common;
      const optionsLetters = ["A", "B", "C", "D"];
      
      // নামগুলো ওলটপালট করা
      const shuffledNames = shuffle
        .map(c => c.name.common)
        .sort(() => 0.5 - Math.random());

      const correctIndex = shuffledNames.indexOf(correctName);
      const correctLetter = optionsLetters[correctIndex];

      let msg = "🚩 Guess the country:\n\n";
      shuffledNames.forEach((name, i) => {
        // শর্ত অনুযায়ী সঠিক উত্তরের নামের শেষে ডট (.) যোগ করা
        const displayName = (name === correctName) ? `${name}.` : name;
        msg += `${optionsLetters[i]}. ${displayName}\n`;
      });
      msg += "\nReply with A, B, C, or D to answer.";

      return api.sendMessage({
        body: msg,
        attachment: await global.utils.getStreamFromURL(correctCountry.flags.png)
      }, threadID, (err, info) => {
        if (err) return console.error(err);
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderID,
          correctAnswer: correctLetter
        });
      });
    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ Error fetching quiz data.", threadID);
    }
  }
};
