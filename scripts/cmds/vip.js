const fs = require("fs-extra");
const path = require("path");

function formatCurrency(number) {
    // undefined বা NaN চেক করা হচ্ছে যাতে error না আসে
    if (number === undefined || number === null || isNaN(number)) return "0";
    if (number < 1000) return number.toString();
    
    const units = ["", "K", "M", "B", "T"];
    const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
    if (tier === 0) return number.toString();
    
    const suffix = units[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;
    return scaled.toFixed(1).replace(/\.0$/, "") + suffix;
}

module.exports = {
    config: {
        name: "vip",
        aliases: ["premium"],
        version: "2.2.0",
        author: "AkHi",
        countDown: 5,
        role: 0, 
        category: "Premium",
        shortDescription: { en: "Manage and view VIP status using DB" },
        guide: { en: "{pn} info | {pn} add [@tag] | {pn} rem [@tag] | {pn} list" }
    },

    onStart: async function ({ api, event, args, role, usersData }) {
        const { threadID, messageID, senderID, mentions, messageReply } = event;
        const action = args[0]?.toLowerCase();

        // ১. ভিআইপি লিস্ট চেক (MongoDB থেকে ডাটা নেওয়া)
        if (action === "list") {
            const allUsers = await usersData.getAll();
            const vipList = allUsers.filter(u => u.data && u.data.isVip === true);
            
            let msg = "🏆 VIP USER LIST 🏆\n━━━━━━━━━━━━━━━\n";
            if (vipList.length === 0) msg += "No VIP users found in Database.";
            else {
                vipList.forEach((user, index) => {
                    msg += `${index + 1}. ${user.name || "Unknown"}\n🆔 ID: ${user.userID}\n`;
                });
            }
            msg += `━━━━━━━━━━━━━━━`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // ২. ভিআইপি ইনফো
        if (action === "info" || !action) {
            const targetID = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || senderID);
            
            try {
                const info = await api.getUserInfo(targetID);
                const name = info[targetID].name;
                const userData = await usersData.get(targetID);
                
                // ব্যালেন্স এবং ভিআইপি স্ট্যাটাস সরাসরি DB থেকে নেওয়া হচ্ছে
                const money = userData.money || 0;
                const isVip = (userData.data && userData.data.isVip === true);

                let msg = `★ VIP INFORMATION ★\n━━━━━━━━━━━━━━━\n`;
                msg += `👤 Name: ${name}\n`;
                msg += `💰 Balance: $${formatCurrency(money)}\n`;
                msg += `✨ Status: ${isVip ? "Premium User ★" : "Normal User"}\n`;
                msg += `━━━━━━━━━━━━━━━\n`;
                msg += isVip ? "Thank you for being a VIP member!" : "Upgrade to VIP to get special perks!";
                
                return api.sendMessage(msg, threadID, messageID);
            } catch (err) {
                return api.sendMessage("❌ Error: Unable to fetch DB info.", threadID, messageID);
            }
        }

        // --- অ্যাডমিন অ্যাকশন (অ্যাড/রিমুভ) ---
        if (role < 2 || role > 4) {
            return api.sendMessage("⚠️ Access Denied! Only Bot Admins can manage VIP list.", threadID, messageID);
        }

        if (action === "add") {
            const targetID = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || args[1]);
            if (!targetID) return api.sendMessage("❌ Please tag or reply to someone.", threadID, messageID);
            
            // MongoDB-তে ডাটা সেভ করা হচ্ছে
            await usersData.set(targetID, { isVip: true }, "data");
            const name = (await api.getUserInfo(targetID))[targetID].name;
            
            return api.sendMessage(`✅ Successfully added ${name} to the VIP list (Saved in DB)!`, threadID, messageID);
        }

        if (action === "rem" || action === "remove") {
            const targetID = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || args[1]);
            
            // MongoDB থেকে স্ট্যাটাস রিমুভ করা
            await usersData.set(targetID, { isVip: false }, "data");
            return api.sendMessage("✅ User removed from VIP status in Database.", threadID, messageID);
        }

        return api.sendMessage("❓ Use: !vip [info | add | rem | list]", threadID, messageID);
    }
};
            
