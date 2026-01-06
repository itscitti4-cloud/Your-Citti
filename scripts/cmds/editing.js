const axios = require('axios');

module.exports = {
  config: {
    name: "edit2",
    version: "1.0.4",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Edit images using AI",
    longDescription: "Reply to an image with prompts to edit it.",
    category: "ai-image",
    guide: "{pn} <edit details>"
  },

  onStart: async function ({ api, event, args, message }) {
    const { messageReply, threadID, messageID } = event;

    // 1. Check if the user replied to a photo
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
      return message.reply("Please reply to a photo with the details of how you want to edit it.");
    }

    // 2. Check if the user provided instructions
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("Please provide instructions on what to change (e.g., !editing add a sunset background).");
    }

    const imageUrl = messageReply.attachments[0].url;
    message.reply("Processing your image with AI... Please wait.");

    try {
      // 3. API Request using your provided API Key
      // Note: Ensure the endpoint URL is correct for the specific service you are using
      const response = await axios.get(`https://api.adobe.io/photoshop/edit`, {
        params: {
          url: imageUrl,
          prompt: prompt,
        },
        headers: {
          "x-api-key": "07a8af7b3532494f8a12b71ef01aba4c"
        }
      });

      const editedImageUrl = response.data.result || response.data.url;

      if (!editedImageUrl) {
        throw new Error("No image URL returned from API");
      }

      // 4. Send the edited image back to the user
      return api.sendMessage({
        body: `✅ Image Edited Successfully!\n\nPrompt: "${prompt}"`,
        attachment: await global.utils.getStreamFromURL(editedImageUrl)
      }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return message.reply("Error: Failed to process the image. Please ensure your API key is valid and the image is accessible.");
    }
  }
};
