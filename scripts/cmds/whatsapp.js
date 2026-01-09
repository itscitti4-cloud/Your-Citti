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
    description: "Download WhatsApp profile picture by number using multiple sources.",
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
        const wait = await api.sendMessage("🔍 Searching multiple servers, please wait...", threadID);

        // Source 1: This is a robust gateway
        const imgUrl = `https://wa-profile-pic.onrender.com/fetch?number=${cleanNumber}`;
        
        // রিকোয়েস্ট পাঠানো হচ্ছে
        const response = await axios({
            url: imgUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 25000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            const stats = fs.statSync(tempPath);
            
            // যদি এপিআই থেকে কোনো ছবি না পাওয়া যায় তবে ছোট ফাইল আসবে
            if (stats.size < 2000) { 
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                api.unsendMessage(wait.messageID);
                return api.sendMessage("❌ প্রোফাইল পিকচারটি 'Private' করা অথবা এই নম্বরে হোয়াটসঅ্যাপ নেই।\n\nপরামর্শ: নম্বরটি অবশ্যই কান্ট্রি কোড সহ দিন (যেমন: 88017...)", threadID, messageID);
            }

            await api.sendMessage({
                body: `✅ WhatsApp Profile Picture found!\n📱 Number: +${cleanNumber}`,
                attachment: fs.createReadStream(tempPath)
            }, threadID);

            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            api.unsendMessage(wait.messageID);
        });

    } catch (error) {
        console.error("WA Fetch Error:", error.message);
        api.sendMessage(`❌ সার্ভার বর্তমানে ওভারলোডেড। কয়েক মিনিট পর আবার চেষ্টা করুন অথবা নিশ্চিত হোন যে নম্বরটি সঠিক।`, threadID, messageID);
    }
};
