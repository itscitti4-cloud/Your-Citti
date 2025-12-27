const axios = require('axios');

module.exports = {
  config: {
    name: "wiki",
    version: "1.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Search information from Wikipedia.",
    longDescription: "Get a summary of any topic directly from Wikipedia.",
    category: "utility",
    guide: {
      en: "{pn} <query>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) {
      return message.reply("Please provide a topic to search (e.g., !wiki Shakib Khan).");
    }

    try {
      // Step 1: Search for the most relevant page title
      const searchRes = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
      
      if (!searchRes.data.query.search.length) {
        return message.reply(`I couldn't find any Wikipedia article for "${query}". Please check your spelling.`);
      }

      const bestTitle = searchRes.data.query.search[0].title;

      // Step 2: Fetch the summary using the best-matched title
      const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle.replace(/ /g, '_'))}`);
      
      const data = response.data;

      if (data.type === 'disambiguation') {
        return message.reply(`The term "${query}" is too broad. Please be more specific.`);
      }

      const title = data.title;
      const description = data.description || "No short description available.";
      const extract = data.extract;
      const wikiUrl = data.content_urls.desktop.page;

      const resultMessage = `🌐 **Wikipedia: ${title}**\n\n` +
                            `📝 **Description:** ${description}\n\n` +
                            `📖 **Summary:** ${extract}\n\n` +
                            `🔗 **Read more:** ${wikiUrl}`;

      if (data.thumbnail && data.thumbnail.source) {
        return api.sendMessage({
          body: resultMessage,
          attachment: await global.utils.getStreamFromURL(data.thumbnail.source)
        }, threadID, messageID);
      } else {
        return message.reply(resultMessage);
      }

    } catch (error) {
      console.error(error);
      return message.reply(`An error occurred while fetching information for "${query}".`);
    }
  }
};
