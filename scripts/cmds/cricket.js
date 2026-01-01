const axios = require("axios");

module.exports = {
  config: {
    name: "cricket",
    version: "1.4",
    author: "AkHi",
    aliases: ["livecricket", "score"],
    countDown: 5,
    role: 0,
    category: "Utility",
    shortDescription: "Get live cricket scores using API",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    // ⚠️ Replace 'YOUR_ACTUAL_API_KEY' with your real key from cricketdata.org
    const apiKey = "729a1f40-bd2c-4a28-9506-ee57e8c468b2"; 
    const url = `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`;

    try {
      const response = await axios.get(url);
      
      // API response check
      if (response.data.status !== "success") {
        return api.sendMessage("❌ API Error: " + (response.data.reason || "Invalid API Key"), event.threadID);
      }

      const matches = response.data.data;

      if (!matches || matches.length === 0) {
        return api.sendMessage("🏏 Currently, no live matches found.", event.threadID);
      }

      // Fetching the first match from the list
      const match = matches[0];
      
      let team1 = match.teams[0];
      let team2 = match.teams[1];
      let status = match.status || "Status unavailable";
      
      // Processing Scores
      let scoreMsg = "";
      if (match.score && Array.isArray(match.score) && match.score.length > 0) {
        match.score.forEach(s => {
          scoreMsg += `\n🔹 ${s.inning}: ${s.r}/${s.w} (${s.o} ov)`;
        });
      } else {
        scoreMsg = "\n⚠️ Score not updated yet.";
      }

      const messageBody = `
🏏 𝗟𝗜𝗩𝗘 𝗠𝗔𝗧𝗖𝗛 𝗨𝗣𝗗𝗔𝗧𝗘 🏏

🏆 Match: ${match.name}
🏟️ Venue: ${match.venue}

🚩 ${team1} vs ${team2}
📊 Status: ${status}
${scoreMsg}

⏰ Start Time: ${new Date(match.dateTimeGMT).toLocaleString()}
      `;

      return api.sendMessage(messageBody, event.threadID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Error: Unable to fetch data from API. Please try again later.", event.threadID);
    }
  }
};
    
