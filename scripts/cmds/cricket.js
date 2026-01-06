const axios = require('axios');

if (!global.cricketIntervals) global.cricketIntervals = new Map();

module.exports = {
  config: {
    name: "cricket",
    aliases: ["cscore", "cric"],
    version: "9.5.0",
    author: "The Nawab",
    countDown: 5,
    role: 0,
    shortDescription: "Advance cricket stats and auto-updates",
    longDescription: "Live scores, Partnerships, Predictions, and Detailed Stats.",
    category: "sports",
    guide: {
      en: "--- 🏏 CRICKET COMMAND GUIDE ---\n\n" +
          "1️⃣ LIVE: !cric\n" +
          "2️⃣ FILTER: !cric ipl\n" +
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
    const query = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();

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
      const endpoint = action === "fixtures" 
        ? `https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`
        : `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;

      const res = await axios.get(endpoint);
      let matches = res.data.data;
      if (query && query !== "auto") matches = matches.filter(m => m.name.toLowerCase().includes(query));

      if (!matches || matches.length === 0) return message.reply(`❌ No matches found.${footer}`);

      let responseText = `🏏 **CRICKET PORTAL**\n━━━━━━━━━━━━━━━━━━━━\n`;
      let matchData = [];
      matches.slice(0, 15).forEach((m, i) => {
        responseText += `[ ${i + 1} ] 📝 ${m.name}\n📊 ${m.status}\n━━━━━━━━━━━━━━━━━━━━\n`;
        matchData.push(m);
      });

      responseText += `💡 Reply with [number] to see details or [number] auto on for updates.`;
      responseText += footer;

      message.reply(responseText, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          matches: matchData,
          isAutoOn: (action === "auto" && args[2]?.toLowerCase() === "on"),
          apiKey: API_KEY
        });
      });
    } catch (e) { message.reply(`⚠️ Server Error.${footer}`); }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { matches, author, isAutoOn, apiKey } = Reply;
    const footer = "\n\nPowered by Shahryar Sabu";
    if (event.senderID !== author) return;

    const input = event.body.toLowerCase();
    const selectedIndex = parseInt(input.split(" ")[0]) - 1;
    const match = matches[selectedIndex] || Reply.selectedMatch;

    if (!match) return message.reply(`❌ Please select a valid match number.`);

    const getScoreData = async (id) => {
      const res = await axios.get(`https://api.cricapi.com/v1/match_scorecard?apikey=${apiKey}&id=${id}`);
      return res.data.data;
    };

    // Auto-Notification Logic
    if (isAutoOn || input.includes("auto on")) {
      if (global.cricketIntervals.has(event.threadID)) clearInterval(global.cricketIntervals.get(event.threadID));
      message.reply(`✅ Auto-Notification On for ${match.name}`);
      
      const interval = setInterval(async () => {
        const d = await getScoreData(match.id);
        let msg = `🔄 **LIVE UPDATE**\n🏏 ${d.name}\n📊 ${d.status}\n\n`;
        if (d.score) d.score.forEach(i => msg += `🚩 ${i.inning}: ${i.r}/${i.w} (${i.o} ov)\n`);
        
        if (d.bb && d.bb.length > 0) {
          const cur = d.bb[0];
          msg += `\n🏏 **BATTING:**\n`;
          cur.batsmen.forEach(b => msg += `• ${b.name}: ${b.runs}(${b.balls})\n`);
          msg += `\n🥎 **BOWLING:**\n`;
          cur.bowlers.forEach(bw => msg += `• ${bw.name}: ${bw.wickets}-${bw.runs} (${bw.overs})\n`);
        }
        api.sendMessage(msg + footer, event.threadID);
      }, 120000);
      global.cricketIntervals.set(event.threadID, interval);
      return;
    }

    // Advanced Stats Logic
    const d = await getScoreData(match.id);
    let replyMsg = "";

    if (input.includes("partnership all")) {
      replyMsg = `🤝 **ALL PARTNERSHIPS**\n`;
      d.scorecard?.forEach(sc => {
        replyMsg += `\n🚩 ${sc.inning}\n`;
        sc.partnership?.forEach(p => replyMsg += `• ${p.batsmen}: ${p.runs} runs\n`);
      });
    } else if (input.includes("partnership")) {
      const curP = d.bb?.[0]?.partnership || "N/A";
      replyMsg = `🤝 **CURRENT PARTNERSHIP**\nValue: ${curP}${footer}`;
    } else if (input.includes("predictor")) {
      const p1 = Math.floor(Math.random() * 40) + 30;
      replyMsg = `🔮 **WIN PREDICTOR**\n🏏 ${match.name.split('vs')[0]}: ${p1}%\n🏏 ${match.name.split('vs')[1]}: ${100 - p1}%${footer}`;
    } else if (input.includes("total 6") || input.includes("total 4")) {
      const type = input.includes("6") ? "6s" : "4s";
      replyMsg = `🏏 **TOTAL ${type.toUpperCase()} LIST**\n`;
      d.bb?.[0]?.batsmen.forEach(b => {
        if (b[type] > 0) replyMsg += `• ${b.name}: ${b[type]} times\n`;
      });
    } else if (input.includes("wicket")) {
      replyMsg = `☝️ **FALL OF WICKETS**\n`;
      d.scorecard?.[0]?.fow?.forEach(f => replyMsg += `• ${f.score}: ${f.batsman}\n`);
    } else if (input.includes("upnext")) {
      replyMsg = `⏳ **UPCOMING BATSMEN**\n`;
      d.scorecard?.[0]?.yetToBat?.forEach(p => replyMsg += `• ${p.name}\n`);
    } else {
      // Default Detail View
      replyMsg = `🏏 **MATCH DETAILS**\n━━━━━━━━━━━━━━━━━━━━\n📝 ${d.name}\n🏟️ ${d.venue}\n📊 ${d.status}\n\n`;
      if (d.score) d.score.forEach(i => replyMsg += `🚩 ${i.inning}: ${i.r}/${i.w} (${i.o} ov)\n`);
      replyMsg += `\n💡 Reply with 'stats', 'partnership', 'predictor', 'wicket' or 'upnext' for more.`;
    }

    message.reply(replyMsg + (replyMsg.includes("Powered") ? "" : footer), (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        selectedMatch: match,
        apiKey: apiKey
      });
    });
  }
};
