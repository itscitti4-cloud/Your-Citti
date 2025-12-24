const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
        config: {
                name: "cover",
                aliases: ["cvr", "cp"],
                version: "1.0",
                author: "AkHi",
                countDown: 5,
                role: 0,
                description: "Fetch user's cover photo",
                category: "utility",
                guide: "{pn}: Fetch your cover photo"
                        + "\n   {pn} <@tag>: Fetch tagged user's cover photo"
                        + "\n   {pn} <uid>: Fetch cover photo from UID"
                        + "\n   {pn} <profile_link>: Fetch cover photo from profile link"
                        + "\n   (Or reply to someone's message)"
        },

        onStart: async function ({ api, message, args, event, usersData }) {
                try {
                        let uid = event.senderID;
                        
                        // UID নির্ধারণ করার লজিক
                        if (event.messageReply) {
                                uid = event.messageReply.senderID;
                        } else if (Object.keys(event.mentions).length > 0) {
                                uid = Object.keys(event.mentions)[0];
                        } else if (args[0]) {
                                if (!isNaN(args[0])) {
                                        uid = args[0];
                                } else if (args[0].includes("facebook.com/")) {
                                        const match = args[0].match(/(?:profile\.php\?id=|\/)([\d]+)/);
                                        if (match) {
                                                uid = match[1];
                                        } else {
                                                const vanityMatch = args[0].match(/facebook\.com\/([^/?]+)/);
                                                if (vanityMatch) {
                                                        try {
                                                                const response = await axios.get(`https://www.facebook.com/${vanityMatch[1]}`);
                                                                const uidMatch = response.data.match(/"userID":"(\d+)"/);
                                                                if (uidMatch) uid = uidMatch[1];
                                                        } catch (err) {
                                                                return message.reply("× Could not extract UID from link.");
                                                        }
                                                }
                                        }
                                }
                        }
                        
                        if (!uid || isNaN(uid))
                                return message.reply("! Invalid UID.");
                        
                        await message.reply("🔍 Fetching cover photo...");
                        
                        const userName = await usersData.getName(uid);
                        
                        // কভার ফটোর জন্য গ্রাফ এপিআই কল
                        const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
                        const graphURL = `https://graph.facebook.com/${uid}?fields=cover&access_token=${token}`;
                        
                        const graphResponse = await axios.get(graphURL);
                        
                        if (!graphResponse.data.cover || !graphResponse.data.cover.source) {
                                return message.reply("× User has no cover photo or it's private.");
                        }

                        const coverURL = graphResponse.data.cover.source;
                        const cachePath = path.join(__dirname, "cache", `cover_${uid}.jpg`);
                        await fs.ensureDir(path.dirname(cachePath));
                        
                        const response = await axios.get(coverURL, { responseType: "arraybuffer" });
                        await fs.writeFile(cachePath, Buffer.from(response.data));
                        
                        await message.reply({
                                body: `✓ Cover photo of ${userName}`,
                                attachment: fs.createReadStream(cachePath)
                        });
                        
                        await fs.remove(cachePath);
                } catch (err) {
                        console.error("Error in cover command:", err);
                        return message.reply("× User profile is restricted or private.");
                }
        }
};
                                          
