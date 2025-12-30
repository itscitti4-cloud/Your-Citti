module.exports = {
    config: {
        name: "edit",
        version: "1.0.0",
        author: "AkHi",
        countDown: 5,
        role: 0,
        shortDescription: "AI Image Editor",
        longDescription: "Reply to an image with a prompt to edit it using AI.",
        category: "ai-image",
        guide: "{pn} [your prompt]"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, type, messageReply } = event;

        // Check if the user is replying to a photo
        if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
            return api.sendMessage("Please reply to a photo with your prompt to edit it.", threadID, messageID);
        }

        const prompt = args.join(" ");
        if (!prompt) {
            return api.sendMessage("Please provide a description of the changes you want. (e.g., 'make it a cyberpunk style')", threadID, messageID);
        }

        const imageUrl = encodeURIComponent(messageReply.attachments[0].url);
        api.sendMessage("Processing your image... Please wait. 🎨", threadID, messageID);

        try {
            /** * Note: Replace the URL below with a working Image-to-Image API.
             * Example: Using a specialized AI endpoint.
             */
            const apiUrl = `https://api.box02.pro.vn/api/img2img?url=${imageUrl}&prompt=${encodeURIComponent(prompt)}`;
            
            return api.sendMessage({
                body: "Successfully edited! Here is your image:",
                attachment: await global.utils.getStreamFromURL(apiUrl)
            }, threadID, messageID);
            
        } catch (error) {
            console.error(error);
            return api.sendMessage("Sorry, an error occurred while processing the image editing.", threadID, messageID);
        }
    }
};
