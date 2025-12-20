const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "setpp",
    version: "1.0.1",
    role: 2, 
    author: "AkHi",
    description: "Set Facebook profile picture",
    category: "social",
    guide: {
        en: "[Reply to an image]"
    },
    countDown: 5
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, messageReply } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("AkHi Ma'am, দয়া করে একটি ছবির রিপ্লাইতে কমান্ডটি লিখুন।", threadID, messageID);
    }

    const imageUrl = messageReply.attachments[0].url;
    const tempPath = path.join(__dirname, "cache", `avatar_${Date.now()}.png`);

    try {
      // ১. ছবিটিকে আগে লোকাল স্টোরেজে ডাউনলোড করা
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      fs.writeFileSync(tempPath, Buffer.from(response.data, 'utf-8'));

      // ২. ফাইল স্ট্রিম তৈরি করে প্রোফাইল পিকচার সেট করা
      // অনেক সময় সরাসরি path দিলেও কাজ করে: api.changeAvatar(fs.createReadStream(tempPath)...)
      api.changeAvatar(fs.createReadStream(tempPath), "", 0, (err) => {
        if (err) {
          console.error(err);
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          return api.sendMessage("AkHi Ma'am, I'm so sorry, set profile failed 🥺", threadID, messageID);
        }

        // ৩. সফল হলে
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return api.sendMessage("AkHi Ma'am, Change bot Profile successfully ✅", threadID, messageID);
      });

    } catch (error) {
      console.error(error);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return api.sendMessage("AkHi Ma'am, something went wrong 🥺", threadID, messageID);
    }
  }
};
