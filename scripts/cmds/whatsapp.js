const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "whatsapp",
    aliases: ["wa"],
    version: "1.2.6",
    author: "Nawab",
    countDown: 5,
    role: 0,
    description: "Download WhatsApp profile picture by number.",
    category: "utility",
    guide: "{pn} [phone_number]"
};

module.exports.onStart = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const number = args[0];

    if (!number) {
        return api.sendMessage("⚠️ Please provide a WhatsApp number with country code (e.g., !wa 88017xxx).", threadID, messageID);
    }

    const cleanNumber = number.replace(/[^\d]/g, '');
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const tempPath = path.join(cacheDir, `wa_dp_${cleanNumber}.jpg`);

    try {
        api.sendMessage("🔍 Fetching profile picture, please wait...", threadID, messageID);

        // একটি পাবলিক এপিআই ব্যবহার করা হচ্ছে (এটি পরিবর্তন হতে পারে)
        // Note: WhatsApp প্রোফাইল পিকচার অনেক সময় প্রাইভেসি সেটিংসের কারণে পাওয়া যায় না
        const imgUrl = `https://api.vyturex.com/wa-pp?number=${cleanNumber}`;

        const response = await axios({
            url: imgUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 15000
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            const stats = fs.statSync(tempPath);
            
            // যদি ফাইল খুব ছোট হয় বা কোনো ডিফল্ট ইমেজ আসে
            if (stats.size < 500) { 
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                return api.sendMessage("❌ Profile picture is private or the number is not on WhatsApp.", threadID, messageID);
            }

            await api.sendMessage({
                body: `✅ WhatsApp Profile Picture found for: +${cleanNumber}`,
                attachment: fs.createReadStream(tempPath)
            }, threadID);

            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        });

        writer.on('error', () => {
            api.sendMessage("❌ Write error occurred while saving the image.", threadID, messageID);
        });

    } catch (error) {
        console.error("WA Fetch Error:", error.message);
        api.sendMessage(`❌ Error: Could not fetch image. Ensure the number has a public DP and is on WhatsApp.`, threadID, messageID);
    }
};
