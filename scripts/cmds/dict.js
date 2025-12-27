const axios = require('axios');

module.exports = {
  config: {
    name: "dict",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Get the definition and meaning of a word.",
    longDescription: "Provides meanings, synonyms, and examples of English words using a dictionary API.",
    category: "utility",
    guide: "{pn} <word>"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;
    const word = args.join(" ");

    // 1. Check if a word is provided
    if (!word) {
      return message.reply("Please provide a word to search (e.g., !dictionary success).");
    }

    try {
      // 2. Fetching data from Free Dictionary API
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = response.data[0];

      // 3. Extracting details
      const { meanings, phonetics } = data;
      const definition = meanings[0].definitions[0].definition;
      const example = meanings[0].definitions[0].example || "No example available.";
      const phonetic = phonetics[0]?.text || "N/A";
      const partOfSpeech = meanings[0].partOfSpeech;

      // 4. Formatting the reply in English
      const resultMessage = `📖 **Dictionary: ${word.toUpperCase()}**\n\n` +
                            `🔊 Phonetic: ${phonetic}\n` +
                            `🏷️ Part of Speech: ${partOfSpeech}\n\n` +
                            `📝 Definition: ${definition}\n\n` +
                            `💡 Example: ${example}`;

      return message.reply(resultMessage);

    } catch (error) {
      console.error(error);
      return message.reply(`Sorry, I couldn't find the meaning of "${word}". Please check the spelling and try again.`);
    }
  }
};
