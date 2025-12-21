const fs = require('fs-extra');
const path = require('path');

const filePath = path.join(process.cwd(), "scripts/cmds/cache/babyData.json");

module.exports = {
  config: {
    name: "tinfo",
    version: "1.0.1",
    author: "AkHi",
    role: 2,
    description: "Check teacher info and ranking.",
    category: "chat",
    guide: { en: "{pn} (reply to a user)" },
    countDown: 5
  },

  onStart: async function ({ api, event, usersData, currenciesData }) {
    const { threadID, messageID, senderID, type, messageReply } = event;
    
    // রিপ্লাই দিলে তার আইডি, না দিলে নিজের আইডি
    let targetID = type === "message_reply" ? messageReply.senderID : senderID;
    
    // ডাটা ফাইল চেক করা
    if (!fs.existsSync(filePath)) {
        return api.sendMessage("❌ Data file not found!", threadID, messageID);
    }

    let data = fs.readJsonSync(filePath);

    try {
        // ইউজারের নাম এবং ব্যালেন্স সংগ্রহ
        const name = await usersData.getName(targetID);
        const userData = await currenciesData.get(targetID);
        const money = userData ? userData.money : 0;
        
        // টিচ সংখ্যা বের করা
        const teachCount = (data.teachers && data.teachers[targetID]) ? data.teachers[targetID] : 0;

        // র‍্যাঙ্কিং বের করা
        let rank = "N/A";
        if (data.teachers) {
            const sortedTeachers = Object.entries(data.teachers)
                .sort((a, b) => b[1] - a[1]);
            const findRank = sortedTeachers.findIndex(item => item[0] === targetID);
            if (findRank !== -1) rank = findRank + 1;
        }

        // ইউজার টাইপ নির্ধারণ
        let userType = "Regular User";
        if (teachCount > 100) userType = "Master Teacher 🏆";
        else if (teachCount > 50) userType = "Pro Teacher 🎖️";
        else if (teachCount > 10) userType = "Active Learner 📖";

        const msg = `👤 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢 👤\n` +
            `━━━━━━━━━━━━━━\n` +
            `📝 Name: ${name}\n` +
            `🎓 Teach: ${teachCount} টি\n` +
            `🏆 Ranking: ${rank}\n` +
            `💎 Balance: ${money} 💸\n` +
            `🎭 Usertype: ${userType}\n` +
            `━━━━━━━━━━━━━━\n` +
            `👑 Admin: Lubna Jannat`;

        return api.sendMessage(msg, threadID, messageID);
    } catch (e) {
        console.log(e);
        return api.sendMessage("Error: " + e.message, threadID, messageID);
    }
  }
};
