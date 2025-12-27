const axios = require('axios');

module.exports = {
  config: {
    name: "capcut",
    version: "1.0.0",
    author: "AkHi",
    countDown: 10,
    role: 0,
    shortDescription: "Search for CapCut templates.",
    longDescription: "Find trending CapCut templates by keywords and get the template link and preview video.",
    category: "multimedia",
    guide: "{pn} <template name>"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    // 1. Check if the user provided a search query
    if (!query) {
      return message.reply("Please provide a template name to search (e.g., !capcut healing thailand).");
    }

    message.reply(`Searching for "${query}" templates... Please wait.`);

    try {
      // 2. Fetching data from a CapCut Search API
      const response = await axios.get(`https://smbt-api.onrender.com/api/capcut?s=${encodeURIComponent(query)}`);
      
      const results = response.data.result;

      if (!results || results.length === 0) {
        return message.reply(`Sorry, I couldn't find any CapCut templates for "${query}".`);
      }

      // Picking the first result for simplicity
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
                        `🔗 Template Link: ${templateLink}`;

      // 3. Sending the preview video along with details
      if (videoUrl) {
        return api.sendMessage({
          body: resultMsg,
          attachment: await global.utils.getStreamFromURL(videoUrl)
        }, threadID, messageID);
      } else {
        return message.reply(resultMsg);
      }

    } catch (error) {
      console.error(error);
      return message.reply("An error occurred while fetching the CapCut template. Please try again later.");
    }
  }
};
