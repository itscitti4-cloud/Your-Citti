const axios = require('axios');

module.exports = {
  config: {
    name: "cvr",
    alias: "co", "cover",
    version: "1.0.0",
    role: 0,
    author: "AkHi",
    description: "Get the cover photo of a user via reply",
    category: "tools",
    usages: "[reply]",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, senderID } = event;

    // কার আইডি থেকে কভার ফটো নেওয়া হবে তা নির্ধারণ (রিপ্লাই দিলে রিপ্লাই থেকে, নাহলে নিজের)
    let targetID;
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (args[0]) {
      // যদি মেনশন বা আইডি দেওয়া হয়
      targetID = Object.keys(event.mentions).length > 0 ? Object.keys(event.mentions)[0] : args[0];
    } else {
      return api.sendMessage("Please reply to a message to get the user's cover photo!", threadID, messageID);
    }

    try {
      // ফেসবুক গ্রাফ এপিআই বা পাবলিকলি স্ক্র্যাপ করার বদলে একটি এপিআই ব্যবহার
      const res = await axios.get(`https://graph.facebook.com/${targetID}?fields=cover&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
      
      if (!res.data.cover || !res.data.cover.source) {
        return api.sendMessage("This user doesn't have a public cover photo or it's restricted.", threadID, messageID);
      }

      const coverUrl = res.data.cover.source;

      // ছবি ডাউনলোড করে চ্যাটে পাঠানো
      const imageStream = (await axios.get(coverUrl, { responseType: 'stream' })).data;

      return api.sendMessage({
        body: `✅ Here is the cover photo of this user:`,
        attachment: imageStream
      }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("Error: Could not fetch the cover photo. The user might have a locked profile or private settings.", threadID, messageID);
    }
  }
};
  
