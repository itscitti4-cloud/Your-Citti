const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "whatsapp",
    aliases: ["wa"],
    version: "1.0.0",
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

    // নম্বর থেকে অপ্রয়োজনীয় চিহ্ন যেমন '+', '-', বা স্পেস সরানো
    const cleanNumber = number.replace(/[^\d]/g, '');

    try {
        api.sendMessage("🔍 Fetching profile picture, please wait...", event.threadID, event.messageID);

        // এখানে আমরা WhatsApp-এর পাবলিক ডাটা সোর্স ব্যবহার করছি
        const imgUrl = `https://unwa.me/v1/profile-picture/${cleanNumber}`;

        const tempPath = path.join(__dirname, 'cache', `wa_dp_${cleanNumber}.jpg`);
        
        // ইমেজ ডাউনলোড করা
        const response = await axios({
            url: imgUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: `✅ Found Profile Picture for: +${cleanNumber}`,
                attachment: fs.createReadStream(tempPath)
            }, event.threadID, () => {
                // ফাইল পাঠানো হয়ে গেলে ডিলিট করে দেওয়া
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }, event.messageID);
        });

        writer.on('error', (err) => {
            console.error(err);
            api.sendMessage("❌ Error while saving the image.", event.threadID, event.messageID);
        });

    } catch (error) {
        console.error(error);
        api.sendMessage("❌ Profile picture not found or the number isn't on WhatsApp. Make sure to use the country code.", event.threadID, event.messageID);
    }
};
