const axios = require("axios");

module.exports = {
  config: {
    name: "nsfw",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 4,
    shortDescription: "Get NSFW images (18+)",
    category: "Fun",
    guide: "{p}nsfw <type> (types: waifu, neko, trap, blowjob)"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const type = args[0] || "waifu"; // ডিফল্ট টাইপ waifu
    
    // নির্দিষ্ট কিছু ক্যাটাগরি
    const validTypes = ["waifu", "neko", "trap", "blowjob"];
    if (!validTypes.includes(type)) {
      return api.sendMessage(`❌ ভুল টাইপ! সঠিক টাইপগুলো হলো: ${validTypes.join(", ")}`, threadID, messageID);
    }

    try {
      api.sendMessage("🔞 NSFW কন্টেন্ট লোড হচ্ছে...", threadID, messageID);

      // একটি ফ্রি NSFW API ব্যবহার করা হয়েছে
      const response = await axios.get(`https://api.waifu.pics/nsfw/${type}`);
      const imageUrl = response.data.url;

      const imageStream = (await axios.get(imageUrl, { responseType: "stream" })).data;

      return api.sendMessage({
        body: `✨ এখানে আপনার [${type}] ছবি:`,
        attachment: imageStream
      }, threadID, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ ছবি লোড করতে সমস্যা হয়েছে। API সার্ভার ডাউন থাকতে পারে।", threadID, messageID);
    }
  }
};
