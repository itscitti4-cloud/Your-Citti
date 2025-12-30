const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "gcimg",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Get current group chat image."
    },
    longDescription: {
      en: "Fetches and sends the current group chat profile picture."
    },
    category: "box chat",
    guide: {
      en: "{p}gcimg"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      // Fetch thread information
      const threadInfo = await api.getThreadInfo(threadID);
      const imageUrl = threadInfo.imageSrc;

      if (!imageUrl) {
        return api.sendMessage("This group doesn't have a profile image set.", threadID, messageID);
      }

      // Path to save the image temporarily
      const imagePath = __dirname + `/cache/gc_image_${threadID}.png`;

      // Download the image using axios
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(imagePath, Buffer.from(response.data, "utf-8"));

      // Send the image as an attachment
      return api.sendMessage({
        body: `✨ Here is the current group image for: ${threadInfo.threadName || "this group"}`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        // Delete the temporary file after sending
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("Failed to fetch the group image. Please try again later.", threadID, messageID);
    }
  }
};
