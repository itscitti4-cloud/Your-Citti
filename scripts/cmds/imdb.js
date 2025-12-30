const axios = require("axios");

module.exports = {
  config: {
    name: "imdb",
    version: "1.0.0",
    role: 0,
    author: "AkHi",
    description: "Movie information in imdb",
    Category: "utility",
    guide: "{pn} Movie name",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const movieName = args.join(" ");

    if (!movieName) {
      return api.sendMessage("দয়া করে মুভির নাম লিখুন। উদাহরণ: /imdb Titanic", threadID, messageID);
    }

    // আপনার OMDb API Key এখানে বসান
    const apiKey = "YOUR_API_KEY_HERE"; 

    try {
      const res = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${apiKey}`);
      
      if (res.data.Response === "False") {
        return api.sendMessage("দুঃখিত, এই নামে কোনো মুভি খুঁজে পাওয়া যায়নি।", threadID, messageID);
      }

      const { Title, Year, Rated, Released, Runtime, Genre, Director, Actors, Plot, Poster, imdbRating } = res.data;

      const message = `🎬 **${Title} (${Year})**\n` +
                      `──────────────────\n` +
                      `⭐ Rating: ${imdbRating}\n` +
                      `📅 Release: ${Released}\n` +
                      `⏳ Runtime: ${Runtime}\n` +
                      `🎭 Genre: ${Genre}\n` +
                      `👨‍ directors: ${Director}\n` +
                      `🌟 Cast: ${Actors}\n\n` +
                      `📝 Plot: ${Plot}`;

      // যদি মুভির পোস্টার থাকে তবে সেটিসহ পাঠানো
      if (Poster && Poster !== "N/A") {
        const imageStream = (await axios.get(Poster, { responseType: "stream" })).data;
        return api.sendMessage({ body: message, attachment: imageStream }, threadID, messageID);
      } else {
        return api.sendMessage(message, threadID, messageID);
      }

    } catch (error) {
      return api.sendMessage("সার্ভার থেকে তথ্য সংগ্রহ করতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};
