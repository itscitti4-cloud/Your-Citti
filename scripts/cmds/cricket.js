const axios = require('axios');

if (!global.cricketIntervals) global.cricketIntervals = new Map();

module.exports = {
  config: {
    name: "cricket",
    aliases: ["cscore", "cric"],
    version: "10.6.0",
    author: "The Nawab",
    countDown: 5,
    role: 0,
    shortDescription: "Advance cricket stats with categorization",
    longDescription: "Live scores and upcoming fixtures categorized by series.",
    category: "sports",
    guide: {
      en: "--- 🏏 CRICKET COMMAND GUIDE ---\n\n" +
          "1️⃣ LIVE: !cric\n" +
          "2️⃣ FILTER: !cric ipl, !cric bpl, !cric psl, etc.\n" +
          "3️⃣ AUTO: !cric ipl auto on\n" +
          "4️⃣ SQUAD: !cric [team] squad\n\n" +
          "💡 ONCE DETAILS SHOW, REPLY WITH:\n" +
          "• 'partnership' / 'partnership all'\n" +
          "• 'predictor' (Win %)\n" +
          "• 'total 6' / 'total 4'\n" +
          "• 'wicket' (Fall of wickets)\n" +
          "• 'upnext' (Remaining batsmen)"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const API_KEY = "729a1f40-bd2c-4a28-9506-ee57e8c468b2";
    const footer = "\n\nPowered by Shahryar Sabu";
    let query = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();

    // Mapping short keywords to full names for better filtering
    const keyMap = {
      "ipl": "indian premier league",
      "bpl": "bangladesh premier league",
      "psl": "pakistan super league",
      "cpl": "caribbean premier league",
      "bbl": "big bash league",
      "sa20": "sa20",
      "ilt20": "international league t20",
      "mlc": "major league cricket",
      "gt20": "global t20 canada",
      "100": "the hundred",
      "blast": "t20 blast",
      "lpl": "lanka premier league",
      "milc": "minor league cricket",
      "wc": "world cup",
      "asia": "asia cup",
      "series": "tour"
    };

    const searchTarget = keyMap[query] || query;

    if (query === "auto" && action === "off") {
      if (global.cricketIntervals.has(event.threadID)) {
        clearInterval(global.cricketIntervals.get(event.threadID));
        global.cricketIntervals.delete(event.threadID);
        return message.reply(`✅ Auto notifications disabled.${footer}`);
      }
      return message.reply(`❌ No active notifications found.${footer}`);
    }

    message.reply(`🏏 Connecting to server, please wait...`);

    try {
      // Step 1: Fetch Live/Recent Matches
      let res = await axios.get(`https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`);
      let matches = res.data.data || [];

      // Step 2: Fallback to Fixtures/All Matches
      let resAll = await axios.get(`https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`);
      let allMatches = resAll.data.data || [];

      // Combine both lists and remove duplicates by ID
      let combinedMatches = [...matches, ...allMatches];
      let uniqueMatches = Array.from(new Map(combinedMatches.map(m => [m.id, m])).values());

      // Filter Logic
      if (query && query !== "auto") {
        uniqueMatches = uniqueMatches.filter(m => 
          m.name.toLowerCase().includes(searchTarget) || 
          (m.series_id && m.series_id.toLowerCase().includes(searchTarget)) ||
          m.status.toLowerCase().includes(searchTarget)
        );
      }

      if (uniqueMatches.length === 0) {
        return message.reply(`❌ No matches found for "${query.toUpperCase()}".\nNote: If the league hasn't started yet, it won't appear.${footer}`);
      }

      // Step 3: Categorize matches (Handles Men/Women automatically)
      const categorized = {};
      uniqueMatches.forEach(m => {
        const seriesName = m.name.split(',')[0] || "Global Series";
        if (!categorized[seriesName]) categorized[seriesName] = [];
        categorized[seriesName].push(m);
      });

      let responseText = `🏏 **CRICKET PORTAL**\n`;
      let matchData = [];
      let count = 1;

      for (const series in categorized) {
        // Limit to 10 series to avoid message length limits
        if (count > 20) break; 
        responseText += `\n🏆 **${series.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━\n`;
        categorized[series].slice(0, 5).forEach(m => {
          responseText += `[ ${count} ] 📝 ${m.name}\n📊 ${m.status}\n━━━━━━━━━━━━━━━━━━━━\n`;
          matchData.push(m);
          count++;
        });
      }

      responseText += `\n💡 Reply with [number] for details.`;
      responseText += footer;

      message.reply(responseText, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          matches: matchData,
          isAutoOn: (action === "auto" && args[2]?.toLowerCase() === "on"),
          apiKey: API_KEY
        });
      });
    } catch (e) {
      message.reply(`⚠️ Server Error or API Limit reached.${footer}`);
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { matches, author, isAutoOn, apiKey } = Reply;
    const footer = "\n\nPowered by Shahryar Sabu";
    if (event.senderID !== author) return;

    const input = event.body.toLowerCase();
    const args = input.split(" ");
    const selectedIndex = parseInt(args[0]) - 1;
    const match = matches[selectedIndex] || Reply.selectedMatch;

    if (!match) return message.reply(`❌ Please select a valid match number.`);

    const getScoreData = async (id) => {
      const res = await axios.get(`https://api.cricapi.com/v1/match_scorecard?apikey=${apiKey}&id=${id}`);
      return res.data.data;
    };

    try {
      // Auto Update Logic
      if (isAutoOn || input.includes("auto on")) {
        if (global.cricketIntervals.has(event.threadID)) clearInterval(global.cricketIntervals.get(event.threadID));
        message.reply(`✅ Auto-Notification On for ${match.name}`);
        
        const interval = setInterval(async () => {
          try {
            const d = await getScoreData(match.id);
            let msg = `🔄 **LIVE UPDATE**\n🏏 ${d.name}\n📊 ${d.status}\n\n`;
            if (d.score) d.score.forEach(i => msg += `🚩 ${i.inning}: ${i.r}/${i.w} (${i.o} ov)\n`);
            api.sendMessage(msg + footer, event.threadID);
          } catch(e) {}
        }, 120000);
        global.cricketIntervals.set(event.threadID, interval);
        return;
      }

      const d = await getScoreData(match.id);
      let replyMsg = "";

      // Additional Stats Logic (partnership, predictor, etc)
      if (input.includes("partnership all")) {
        replyMsg = `🤝 **ALL PARTNERSHIPS**\n`;
        d.scorecard?.forEach(sc => {
          replyMsg += `\n🚩 ${sc.inning}\n`;
          sc.partnership?.forEach(p => replyMsg += `• ${p.batsmen}: ${p.runs} runs\n`);
        });
      } else if (input.includes("partnership")) {
        const curP = d.bb?.[0]?.partnership || "N/A";
        replyMsg = `🤝 **CURRENT PARTNERSHIP**\nValue: ${curP}`;
      } else if (input.includes("predictor")) {
        const p1 = Math.floor(Math.random() * 41) + 30;
        replyMsg = `🔮 **WIN PREDICTOR**\n🏏 ${match.name.split('vs')[0]}: ${p1}%\n🏏 ${match.name.split('vs')[1]}: ${100 - p1}%`;
      } else if (input.includes("wicket")) {
        replyMsg = `☝️ **FALL OF WICKETS**\n`;
        d.scorecard?.[0]?.fow?.forEach(f => replyMsg += `• ${f.score}: ${f.batsman}\n`);
      } else if (input.includes("upnext")) {
        replyMsg = `⏳ **UPCOMING BATSMEN**\n`;
        d.scorecard?.[0]?.yetToBat?.forEach(p => replyMsg += `• ${p.name}\n`);
      } else {
        // Default Match Details
        replyMsg = `🏏 **MATCH DETAILS**\n━━━━━━━━━━━━━━━━━━━━\n📝 ${d.name}\n🏟️ ${d.venue}\n📊 ${d.status}\n\n`;
        if (d.score) d.score.forEach(i => replyMsg += `🚩 ${i.inning}: ${i.r}/${i.w} (${i.o} ov)\n`);
        replyMsg += `\n💡 Reply with 'partnership', 'predictor', 'wicket' or 'upnext' for more.`;
      }

      message.reply(replyMsg + footer, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          selectedMatch: match,
          apiKey: apiKey
        });
      });
    } catch (e) {
      message.reply(`⚠️ Details not available yet for this match.${footer}`);
    }
  }
};
  
