const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "whatsapp",
    aliases: ["wa", "wp"],
    version: "1.4.0",
    author: "Nawab",
    countDown: 5,
    role: 0,
    description: "Download WhatsApp profile picture by number using your own API.",
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
        const wait = await api.sendMessage("🔍 Searching profile picture via your API...", threadID);

        // --- আপনার Render API লিঙ্কটি এখানে বসান ---
        // উদাহরণ: https://nawab-api.onrender.com
        const yourApiUrl = "আপনার-রেন্ডার-লিঙ্ক-এখানে-দিন"; 
        
        const imgUrl = `${yourApiUrl}/api/whatsapp?number=${cleanNumber}`;
        
        // আপনার API থেকে ইমেজ জেনারেট করে স্ট্রিম করা হচ্ছে
        const response = await axios({
            url: imgUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 25000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            if (!fs.existsSync(tempPath)) {
                api.unsendMessage(wait.messageID);
                return api.sendMessage("❌ Failed to download image from API.", threadID, messageID);
            }

            const stats = fs.statSync(tempPath);
            
            // সাইজ চেক (যদি ছবি না পাওয়া যায় তবে ছোট সাইজ হবে)
            if (stats.size < 2000) { 
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                api.unsendMessage(wait.messageID);
                return api.sendMessage("❌ প্রোফাইল পিকচারটি পাওয়া যায়নি। নম্বরটি সঠিক কিনা বা এটি 'Private' কিনা চেক করুন।", threadID, messageID);
            }

            await api.sendMessage({
                body: `✅ WhatsApp Profile Picture found!\n📱 Number: +${cleanNumber}`,
                attachment: fs.createReadStream(tempPath)
            }, threadID);

            // ক্যাশ ফাইল ডিলিট
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            api.unsendMessage(wait.messageID);
        });

        writer.on('error', (err) => {
            console.error("Writer Error:", err);
            api.sendMessage("⚠️ Error saving the image.", threadID, messageID);
        });

    } catch (error) {
        console.error("WA Fetch Error:", error.message);
        api.sendMessage(`❌ আপনার API সার্ভার বর্তমানে রেসপন্স দিচ্ছে না। নিশ্চিত হোন যে আপনার Render সার্ভারটি চালু আছে।`, threadID, messageID);
    }
};
