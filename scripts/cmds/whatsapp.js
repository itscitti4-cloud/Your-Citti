const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "whatsapp",
    aliases: ["wa"],
    version: "1.2.0",
    author: "Nawab",
    countDown: 5,
    role: 0,
    description: "Download WhatsApp profile picture by number.",
    category: "utility",
    guide: "{pn} [phone_number]"
};

module.exports.onStart = async ({ api, event, args }) => {
    const number = args[0];

    if (!number) {
        return api.sendMessage("⚠️ Please provide a WhatsApp number with country code (e.g., !wa 88017xxx).", event.threadID, event.messageID);
    }

    // নম্বর থেকে শুধু ডিজিট রাখা
    const cleanNumber = number.replace(/[^\d]/g, '');

    // ক্যাশ ফোল্ডার পাথ নিশ্চিত করা
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const tempPath = path.join(cacheDir, `wa_dp_${cleanNumber}.png`);

    try {
        const waitMessage = await api.sendMessage("🔍 Fetching profile picture, please wait...", event.threadID);

        // স্টেবল পাবলিক গেটওয়ে ব্যবহার করা হয়েছে
        const imgUrl = `https://unwa.me/v1/profile-picture/${cleanNumber}`;

        const response = await axios({
            url: imgUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            // চেক করা হচ্ছে ফাইলটি আসলেও ইমেজ কি না (খালি ফাইল বা এরর পেজ কি না)
            const stats = fs.statSync(tempPath);
            if (stats.size < 500) { 
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                return api.sendMessage("❌ Profile picture is private or not set for this number.", event.threadID, event.messageID);
            }

            await api.sendMessage({
                body: `✅ WhatsApp Profile Picture found for: +${cleanNumber}`,
                attachment: fs.createReadStream(tempPath)
            }, event.threadID);

            // ফাইল পাঠানো হয়ে গেলে ডিলিট করা
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            if (waitMessage) api.unsendMessage(waitMessage.messageID);
        });

        writer.on('error', (err) => {
            console.error(err);
            api.sendMessage("❌ Write error occurred.", event.threadID, event.messageID);
        });

    } catch (error) {
        console.error("WA Fetch Error:", error.message);
        api.sendMessage("❌ Could not connect to the server. Make sure the number is correct with country code.", event.threadID, event.messageID);
    }
};
