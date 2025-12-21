const fs = require('fs-extra');
const path = require('path');

const filePath = path.join(__dirname, "cache", "babyData.json");

module.exports.config = {
    name: "tinfo",
    version: "1.0.0",
    author: "AkHi",
    role: 2,
    description: "Check teacher info and ranking.",
    category: "chat",
    guide: { en: "{pn} (reply to a user)" },
    countDown: 5
};

module.exports.onStart = async ({ api, event, usersData, currenciesData }) => {
    const { threadID, messageID, senderID, type, messageReply } = event;
    
    let targetID = type === "message_reply" ? messageReply.senderID : senderID;
    let data = fs.readJsonSync(filePath);

    try {
        const userData = await usersData.get(targetID);
        const balance = await currenciesData.get(targetID);
        
        // টিচ সংখ্যা বের করা
        const teachCount = data.teachers[targetID] || 0;

        // র‍্যাঙ্কিং বের করা
        const sortedTeachers = Object.entries(data.teachers)
            .sort((a, b) => b[1] - a[1]);
        const rank = sortedTeachers.findIndex(item => item[0] === targetID) + 1;

        // ইউজার টাইপ নির্ধারণ
        let userType = "Regular User";
        if (teachCount > 100) userType = "Master Teacher 🏆";
        else if (teachCount > 50) userType = "Pro Teacher 🎖️";
        else if (teachCount > 10) userType = "Active Learner 📖";

        const msg = `👤 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢 👤\n` +
            `━━━━━━━━━━━━━━\n` +
            `📝 Name: ${userData.name}\n` +
            `🎓 Teach: ${teachCount} টি\n` +
            `🏆 Ranking: ${rank > 0 ? rank : "N/A"}\n` +
            `💎 Balance: ${balance.money} 💸\n` +
            `🎭 Usertype: ${userType}\n` +
            `━━━━━━━━━━━━━━\n` +
            `👑 Admin: Lubna Jannat`;

        return api.sendMessage(msg, threadID, messageID);
    } catch (e) {
        return api.sendMessage("Error: " + e.message, threadID, messageID);
    }
};
