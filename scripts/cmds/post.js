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
      en: "{p} post <caption>",
    }
  },
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const message = args.join(" ");
    if (!message) return api.sendMessage("Wrong format. usage: !post <enter your caption>", threadID, messageID);
    try {
      await api.sendMessage(message, threadID);
      api.sendMessage("AkHi Ma'am, Post done successfully ✅", threadID, messageID);
    } catch (error) {
      api.sendMessage("AkHi Ma'am, I'm so sorry, post failed🥺", threadID, messageID);
    }
  }
};
