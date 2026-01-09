const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "whatsapp",
    aliases: ["wa"],
    version: "1.3.0",
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
        const wait = await api.sendMessage("🔍 Fetching profile picture, please wait...", threadID);

        // বিকল্প এপিআই সোর্স যা বর্তমানে বেশি কাজ করছে
        const imgUrl = `https://wa-pfp-downloader.onrender.com/api/get-pfp?number=${cleanNumber}`;

        const response = await axios({
            url: imgUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            const stats = fs.statSync(tempPath);
            
            // ফাইলের সাইজ চেক করা হচ্ছে (খুব ছোট হলে সেটি এরর পেজ হতে পারে)
            if (stats.size < 1000) { 
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                api.unsendMessage(wait.messageID);
                return api.sendMessage("❌ Profile picture is private or the number is not on WhatsApp. (Make sure to include country code)", threadID, messageID);
            }

            await api.sendMessage({
                body: `✅ WhatsApp Profile Picture found for: +${cleanNumber}`,
                attachment: fs.createReadStream(tempPath)
            }, threadID);

            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            api.unsendMessage(wait.messageID);
        });

        writer.on('error', () => {
            api.unsendMessage(wait.messageID);
            api.sendMessage("❌ Error while saving the image.", threadID, messageID);
        });

    } catch (error) {
        console.error("WA Fetch Error:", error.message);
        api.sendMessage(`❌ API Error: বর্তমানে সার্ভার রেসপন্স করছে না। পরে আবার চেষ্টা করুন অথবা নম্বরটি চেক করুন।`, threadID, messageID);
    }
};
