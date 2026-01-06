const axios = require('axios');

module.exports = {
  config: {
    name: "cricket",
    aliases: ["cscore", "cric"],
    version: "5.5.0",
    author: "The Nawab",
    countDown: 5,
    role: 0,
    shortDescription: "Live scores, Schedule, and Series filtering",
    longDescription: "View live matches, filter by series (IPL, BPL, etc.), and see details via reply.",
    category: "sports",
    guide: {
      en: "{p}cricket (all live)\n{p}cricket ipl (filter ipl)\n{p}cricket ipl list (total matches)\n{p}cricket ipl schedule"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const API_KEY = "729a1f40-bd2c-4a28-9506-ee57e8c468b2";
    const query = args[0]?.toLowerCase();
    const subQuery = args[1]?.toLowerCase();
    const footer = "\n\nPowered by Shahryar Sabu";

    // Valid keywords for sub-commands
    const validSubCommands = ["schedule", "list", "pointtable"];
    
    // Guide if user uses wrong sub-command format
    if (args.length > 1 && !validSubCommands.includes(subQuery)) {
      return message.reply(`❌ Invalid format.\n💡 Use: !cricket [series] [list/schedule]\nExample: !cricket ipl schedule${footer}`);
    }

    message.reply("🏏 Fetching data from server, please wait...");

    try {
      let endpoint = `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;
      
      if (subQuery === "schedule" || subQuery === "list") {
        endpoint = `https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`;
      }

      const res = await axios.get(endpoint);
      let matches = res.data.data;

      if (!matches || matches.length === 0) {
        return message.reply(`❌ No live data found at the moment.${footer}`);
      }

      // Filter by series if query exists (IPL, BPL, WC, etc.)
      if (query) {
        matches = matches.filter(m => m.name.toLowerCase().includes(query) || (m.status && m.status.toLowerCase().includes(query)));
      }

      if (matches.length === 0) {
        return message.reply(`❌ No matches found for "${query.toUpperCase()}". Check the series name and try again.${footer}`);
      }

      let responseText = `🏏 **CRICKET PORTAL: ${query ? query.toUpperCase() : "LIVE EVENTS"}**\n`;
      responseText += `━━━━━━━━━━━━━━━━━━━━\n`;

      let matchData = [];
      matches.slice(0, 15).forEach((match, index) => {
        const matchNum = index + 1;
        responseText += `[ ${matchNum} ] 📝 ${match.name}\n`;
        responseText += `📊 Status: ${match.status}\n`;
        if(match.dateTimeGMT) responseText += `⏰ Date: ${match.dateTimeGMT.split('T')[0]}\n`;
        responseText += `━━━━━━━━━━━━━━━━━━━━\n`;
        matchData.push(match);
      });

      responseText += `\n💡 *Reply with the number to see details.*`;
      responseText += footer;

      message.reply(responseText, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          matches: matchData
        });
      });

    } catch (error) {
      console.error(error);
      message.reply(`⚠️ API Error! Please check your API key limit or try again later.${footer}`);
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { matches, author } = Reply;
    const footer = "\n\nPowered by Shahryar Sabu";

    if (event.senderID !== author) return;

    const selectedIndex = parseInt(event.body) - 1;
    if (isNaN(selectedIndex) || !matches[selectedIndex]) {
      return message.reply(`❌ Invalid selection. Please reply with a valid number from the list above.${footer}`);
    }

    const match = matches[selectedIndex];
    let details = `🏏 **MATCH FULL DETAILS**\n━━━━━━━━━━━━━━━━━━━━\n`;
    details += `📝 **Match:** ${match.name}\n`;
    details += `🏟️ **Venue:** ${match.venue || "TBA"}\n`;
    details += `📊 **Status:** ${match.status}\n\n`;

    if (match.score && Array.isArray(match.score) && match.score.length > 0) {
      match.score.forEach(s => {
        details += `🚩 ${s.inning}: ${s.r}/${s.w} (${s.o} ov)\n`;
      });
    } else {
      details += `⭐ Score: Not available or match not started.${footer}`;
    }

    details += `━━━━━━━━━━━━━━━━━━━━\n`;
    details += `🆔 MatchID: ${match.id}`;
    details += footer;

    message.reply(details);
  }
};
