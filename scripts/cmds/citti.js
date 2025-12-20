const fs = require("fs-extra");

module.exports = {
  config: {
    name: "citti",
    aliases: ["citti","chitti"],
    version: "1.0",
    author: "AkHi",
    countDown: 5,
    role: 2,
    shortDescription: "Teach the bot new words",
    longDescription: "",
    category: "chat",
    guide: {
      en: "{p} teach <Message> <Reply>",
    }
  },
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const { config } = global.GoatBot;
    const data = args.join(" ").split("|");
    if (data.length < 2) return api.sendMessage("Wrong format! Teach <Message> | <Reply>", threadID, messageID);
    const question = data[0].trim();
    const answer = data[1].trim();
    const path = __dirname + "/data/chat.json";
    let dataChat = fs.readFileSync(path, "utf-8");
    dataChat = JSON.parse(dataChat);
    if (!dataChat[question]) {
      dataChat[question] = answer;
      fs.writeFileSync(path, JSON.stringify(dataChat, null, 2));
      api.sendMessage("Teach done successfully!", threadID, messageID);
    } else {
      api.sendMessage("This teach already exist!", threadID, messageID);
    }
  }
};
