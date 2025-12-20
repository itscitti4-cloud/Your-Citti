const axios = require("axios");

module.exports = {
  config: {
    name: "post",
    aliases: ["post"],
    version: "1.0",
    author: "AkHi",
    countDown: 5,
    role: 2,
    shortDescription: "post on Facebook",
    longDescription: "",
    category: "Social",
    guide: {
      en: "{p} post <post text>",
    }
  },
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const { config } = global.GoatBot;
    const postText = args.join(" ");

    if (!postText) return api.sendMessage("Wrong format! post <post text>", thread
