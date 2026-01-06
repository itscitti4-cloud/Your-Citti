const axios = require('axios');

module.exports = {
  config: {
    name: "cricket",
    aliases: ["sports", "crckt"],
    version: "3.0.0",
    author: "Sabu",
    countDown: 5,
    role: 0,
    shortDescription: "Live Cricket Scores with details on reply",
    longDescription: "Get live cricket score list and reply with match number for full details.",
    category: "sports",
    guide: {
      en: "{p}cricket ipl\n{p}cricket bpl"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ").toLowerCase();
    if (!query) return message.reply("Please provide a series name. Example: !cricket ipl");

    message.reply("🔍 Searching for matches, please wait...");

    try {
      const res = await axios.get(`https://api.cric-score.vic79.workers.dev/score?series=${query}`);
      const matches = res.data.match;

      if (!matches || matches.length === 0) {
        return message.reply(`❌ No live matches found for "${query.toUpperCase()}".`);
      }

      let responseText = `🏏 **MATCH LIST: ${query.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━\n`;
      let matchData = [];

      matches.slice(0, 10).forEach((match, index) => {
        const matchNum = index + 1;
        responseText += `[ ${matchNum} ] 📝 ${match.title}\n📊 Status: ${match.status}\n━━━━━━━━━━━━━━━━━━━━\n`;
        matchData.push(match);
      });

      responseText += `\n💡 *Reply with the Match Number (e.g., 1) to see full details.*`;

      message.reply(responseText, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          matches: matchData
        });
      });

    } catch (error) {
      message.reply("⚠️ Error: Unable to fetch scores. Please try again later.");
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { matches, author } = Reply;
    if (event.senderID !== author) return;

    const selectedIndex = parseInt(event.body) - 1;

    if (isNaN(selectedIndex) || !matches[selectedIndex]) {
      return message.reply("❌ Invalid selection. Please reply with a valid match number from the list.");
    }

    const match = matches[selectedIndex];

    let detailText = `🏏 **MATCH DETAILS**\n━━━━━━━━━━━━━━━━━━━━\n`;
    detailText += `📝 **Title:** ${match.title}\n`;
    detailText += `📊 **Status:** ${match.status}\n`;
    detailText += `⭐ **Current Score:** ${match.score || "N/A"}\n`;
    detailText += `🏟️ **Venue:** ${match.venue || "N/A"}\n`;
    detailText += `━━━━━━━━━━━━━━━━━━━━\n`;
    detailText += `🕒 *Update: Just Now*`;

    message.reply(detailText);
  }
};
