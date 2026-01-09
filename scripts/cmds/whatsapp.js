const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "whatsapp",
    aliases: ["wa"],
    version: "1.2.5",
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

    const cleanNumber = number.replace(/[^\d]/g, '');
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const tempPath = path.join(cacheDir, `wa_dp_${cleanNumber}.jpg`);

    try {
        const waitMessage = await api.sendMessage("🔍 Fetching profile picture, please wait...", event.threadID);

        // বিকল্প এবং শক্তিশালী এপিআই সোর্স (এটি প্রক্সি হিসেবে কাজ করে)
        const imgUrl = `https://pfp.wa.me/${cleanNumber}`;

        const response = await axios({
            url: imgUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            const stats = fs.statSync(tempPath);
            // যদি ফাইল খুব ছোট হয়, তার মানে ইমেজ পাওয়া যায়নি (error page download হয়েছে)
            if (stats.size < 1000) { 
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                return api.sendMessage("❌ Profile picture is private or the number is not on WhatsApp.", event.threadID, event.messageID);
            }

            await api.sendMessage({
                body: `✅ WhatsApp Profile Picture found for: +${cleanNumber}`,
                attachment: fs.createReadStream(tempPath)
            }, event.threadID);

            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            if (waitMessage) api.unsendMessage(waitMessage.messageID);
        });

        writer.on('error', (err) => {
            api.sendMessage("❌ Write error occurred while saving the image.", event.threadID, event.messageID);
        });

    } catch (error) {
        console.error("WA Fetch Error:", error.message);
        api.sendMessage(`❌ Error: ${error.message}. Please try again later or check if the number has a public DP.`, event.threadID, event.messageID);
    }
};
