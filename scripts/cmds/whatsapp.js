const axios = require('axios');
const fs = require('fs-extra'); // fs এর বদলে fs-extra ব্যবহার করা ভালো
const path = require('path');

module.exports.config = {
    name: "whatsapp",
    aliases: ["wa"],
    version: "1.1.0",
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

    // ক্যাশ ফোল্ডার চেক করা
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const tempPath = path.join(cacheDir, `wa_dp_${cleanNumber}.jpg`);

    try {
        api.sendMessage("🔍 Fetching profile picture, please wait...", event.threadID, event.messageID);

        // বিকল্প এপিআই সোর্স (এটি সাধারণত পাবলিক ডিপি ফেচ করতে ভালো কাজ করে)
        const imgUrl = `https://api.whatsapp.com/v1/profile-picture/${cleanNumber}?size=large`;
        
        // কিছু ক্ষেত্রে এই লিঙ্কটি কাজ করে: 
        // const imgUrl = `https://pps.whatsapp.net/v/t61.2488-24/...` (এটি সরাসরি পাওয়া কঠিন)
        // তাই আমরা একটি স্থিতিশীল গেটওয়ে ব্যবহার করার চেষ্টা করছি:
        const proxyUrl = `https://wa-profile-pic-downloader.vercel.app/api/photo?number=${cleanNumber}`;

        const response = await axios({
            url: proxyUrl, // আমি এখানে একটি প্রক্সি গেটওয়ে সাজেস্ট করছি
            method: 'GET',
            responseType: 'stream',
            timeout: 10000
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            if (fs.statSync(tempPath).size < 1000) { // যদি ফাইল সাইজ খুব ছোট হয় (অর্থাৎ ইমেজ পাওয়া যায়নি)
                fs.unlinkSync(tempPath);
                return api.sendMessage("❌ Profile picture is private or not found for this number.", event.threadID, event.messageID);
            }

            api.sendMessage({
                body: `✅ WhatsApp Profile Picture found for: +${cleanNumber}`,
                attachment: fs.createReadStream(tempPath)
            }, event.threadID, () => {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }, event.messageID);
        });

        writer.on('error', () => {
            api.sendMessage("❌ Error while downloading the image.", event.threadID, event.messageID);
        });

    } catch (error) {
        console.error(error.message);
        api.sendMessage("❌ Could not fetch the image. The number might be invalid, or the profile picture is set to 'Nobody'.", event.threadID, event.messageID);
    }
};
