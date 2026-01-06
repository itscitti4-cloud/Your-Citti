const axios = require('axios');

module.exports = {
  config: {
    name: "cricket",
    aliases: ["sports", "crckt"],
    version: "2.1.0",
    author: "Sabu",
    countDown: 5,
    role: 0,
    shortDescription: "Live Cricket Scores for IPL, BPL, WC, etc.",
    longDescription: "Get live cricket score updates using series names like IPL, BPL, etc.",
    category: "sports",
    guide: {
      en: "{p}cricket ipl\n{p}cricket bpl\n{p}cricket wc"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ").toLowerCase();
    
    if (!query) {
      return message.reply("Please provide a series name. Example: !cricket ipl");
    }

    message.reply("Searching for live scores, please wait...");

    try {
      // Fetching data from the cricket API
      const res = await axios.get(`https://cricket-api-nodejs-six.vercel.app/score?series=${query}`);
      const data = res.data;

      if (!data || data.length === 0) {
        return message.reply(`Sorry, no live matches found for ${query.toUpperCase()} at the moment.`);
      }

      let responseText = `🏏 **Live Cricket Score: ${query.toUpperCase()}**\n\n`;

      // Displaying up to top 3 matches
      data.slice(0, 3).forEach((match, index) => {
        responseText += `🔹 Match ${index + 1}: ${match.title}\n`;
        responseText += `📊 Status: ${match.update}\n`;
        responseText += `🏟️ Venue: ${match.venue || 'N/A'}\n`;
        responseText += `--------------------------\n`;
      });

      message.reply(responseText);

    } catch (error) {
      console.error(error);
      message.reply("Error fetching scores. The API might be down or busy. Please try again later.");
    }
  }
};
