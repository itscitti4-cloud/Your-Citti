const axios = require('axios');

module.exports = {
  config: {
    name: "upscale",
    version: "1.0.0",
    author: "AkHi",
    countDown: 10,
    role: 0,
    shortDescription: "Upscale image to HD/4K quality.",
    longDescription: "Reply to an image to enhance its quality and resolution.",
    category: "ai-image",
    guide: "{pn} (reply to an image)"
  },

  onStart: async function ({ api, event, message }) {
    const { messageReply, threadID, messageID } = event;

    // 1. Check if the user replied to a photo
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
      return message.reply("Please reply to a photo that you want to upscale to HD quality.");
    }

    const imageUrl = messageReply.attachments[0].url;
    message.reply("Enhancing image quality to 4K... Please wait a moment.");

    try {
      // 2. Using an Image Upscaler API (Example: Upscale API)
      // Note: You can replace this with your preferred Upscaler Endpoint
      const response = await axios.get(`https://api.shams-api.xyz/ai/upscale`, {
        params: {
          url: imageUrl
        }
      });

      const upscaledUrl = response.data.result || response.data.url;

      if (!upscaledUrl) {
        throw new Error("Failed to upscale image.");
      }

      // 3. Send the HD image back
      return api.sendMessage({
        body: "✅ Image Upscaled to HD/4K Successfully!",
        attachment: await global.utils.getStreamFromURL(upscaledUrl)
      }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return message.reply("Sorry, I couldn't upscale the image. The server might be busy or the image is unsupported.");
    }
  }
};
