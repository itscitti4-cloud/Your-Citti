const axios = require("axios");

module.exports = {
  config: {
    name: "role",
    version: "2.7.0",
    role: 4,
    author: "AkHi",
    description: "Searches Rule 34 for an image.",
    category: "fun",
    usages: "[tag]",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const tag = args.join("_");

    if (!tag) {
      return api.sendMessage("অনুগ্রহ করে একটি ট্যাগ প্রদান করুন। যেমন: !bby naruto", threadID, messageID);
    }

    try {
      // Rule34 API URL (JSON ফরম্যাটে)
      const apiUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${encodeURIComponent(tag)}&limit=100&json=1`;
      
      const res = await axios.get(apiUrl);
      const data = res.data;

      if (data && data.length > 0) {
        // র‍্যান্ডম একটি ছবি সিলেক্ট করা
        const randomIndex = Math.floor(Math.random() * data.length);
        const imageUrl = data[randomIndex].file_url;

        // ইমেজ ডাউনলোড করে স্ট্রিম তৈরি করা
        const imageStream = (await axios.get(imageUrl, { responseType: 'stream' })).data;

        return api.sendMessage({
          body: `✅ এই নাও তোমার জন্য ফলাফল!\nট্যাগ: ${tag.replace(/_/g, " ")}`,
          attachment: imageStream
        }, threadID, messageID);
      } else {
        return api.sendMessage(`❌ দুঃখিত সোনা, "${tag}" এই ট্যাগে কোনো ছবি খুঁজে পাইনি। অন্য কিছু ট্রাই করো!`, threadID, messageID);
      }
    } catch (error) {
      console.error("R34 Error:", error.message);
      return api.sendMessage("সার্ভার একটু বিজি অথবা এপিআই কাজ করছে না জানু! পরে ট্রাই করো। 🤧", threadID, messageID);
    }
  }
};
