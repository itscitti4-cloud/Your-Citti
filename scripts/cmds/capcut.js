const axios = require('axios');

module.exports = {
  config: {
    name: "capcut",
    version: "1.0.1",
    author: "AkHi",
    countDown: 10,
    role: 0,
    shortDescription: "Search for CapCut templates.",
    longDescription: "Find trending CapCut templates and get the video preview.",
    category: "media",
    guide: {
      en: "{pn} <template name>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) {
      return message.reply("Please provide a template name (e.g., !capcut healing thailand).");
    }

    api.setMessageReaction("⌛", messageID, () => {}, true);
    message.reply(`Searching for "${query}"... Please wait.`);

    try {
      // Updated with a more stable API
      const response = await axios.get(`https://api.samirxpikachu.run/api/capcut?s=${encodeURIComponent(query)}`);
      
      const results = response.data.result;

      if (!results || results.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply(`Sorry, I couldn't find any CapCut templates for "${query}".`);
      }

      // Taking the first result
      const template = results[0];
      const title = template.title || "CapCut Template";
      const authorName = template.author || "Unknown";
      const usage = template.usage || "N/A";
      const videoUrl = template.video || template.url;
      const templateLink = template.link;

      const resultMsg = `🎬 **CapCut Template Found!**\n\n` +
                        `📌 Title: ${title}\n` +
                        `👤 Author: ${authorName}\n` +
                        `🔥 Total Usage: ${usage}\n\n` +
                        `🔗 Template Link: ${templateLink}\n\n` +
                        `👤 Code Author: AkHi`;

      if (videoUrl) {
        await api.sendMessage({
          body: resultMsg,
          attachment: await global.utils.getStreamFromURL(videoUrl)
        }, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
      } else {
        return message.reply(resultMsg);
      }

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply("An error occurred because the CapCut server is currently busy or the API is down. Please try again later.");
    }
  }
};
