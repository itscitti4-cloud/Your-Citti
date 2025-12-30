const fs = require("fs-extra");
const path = require("path");

const dbPath = path.join(__dirname, "../../vips.json");

// Function to format money (K, M, B, T)
function formatCurrency(number) {
    if (number < 1000) return number.toString();
    const units = ["", "K", "M", "B", "T"];
    const tier = Math.floor(Math.log10(number) / 3);
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
        version: "2.1.0",
        author: "AkHi",
        countDown: 5,
        role: 0, 
        category: "Premium",
        shortDescription: "Manage and view VIP status",
        guide: "{pn} info | {pn} add [@tag] | {pn} rem [@tag] | {pn} list"
    },

    onStart: async function ({ api, event, args, Users, role }) {
        const { threadID, messageID, senderID, mentions, messageReply } = event;

        if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, {});
        let vips = fs.readJsonSync(dbPath);

        const action = args[0]?.toLowerCase();

        // 1. VIP LIST (সবাই দেখতে পারবে)
        if (action === "list") {
            let msg = "🏆 VIP USER LIST 🏆\n━━━━━━━━━━━━━━━\n";
            const list = Object.entries(vips);
            if (list.length === 0) msg += "No VIP users found.";
            else {
                list.forEach(([id, data], index) => {
                    msg += `${index + 1}. ${data.name}\n🆔 ID: ${id}\n`;
                });
            }
            msg += `━━━━━━━━━━━━━━━`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // 2. VIP INFO (সবাই দেখতে পারবে)
        if (action === "info" || !action) {
            const targetID = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || senderID);
            const name = await Users.getName(targetID);
            const userData = await Users.get(targetID);
            const money = userData.money || 0;
            const isVip = vips[targetID] ? "Premium User ★" : "Normal User";

            let msg = `★ VIP INFORMATION ★\n━━━━━━━━━━━━━━━\n`;
            msg += `👤 Name: ${name}\n`;
            msg += `💰 Balance: $${formatCurrency(money)}\n`;
            msg += `✨ Status: ${isVip}\n`;
            msg += `━━━━━━━━━━━━━━━\n`;
            msg += vips[targetID] ? "Thank you for being a VIP member!" : "Upgrade to VIP to get special perks!";
            
            return api.sendMessage(msg, threadID, messageID);
        }

        // --- ADMIN ONLY ACTIONS (Add/Rem) ---
        // এখানে রোল ২ থেকে ৪ পর্যন্ত চেক করা হচ্ছে
        if (role < 2 || role > 4) {
            return api.sendMessage("⚠️ Access Denied! Only AkHi Ma'am can manage VIP list.", threadID, messageID);
        }

        // 3. VIP ADD (Admin Only)
        if (action === "add") {
            const targetID = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || args[1]);
            if (!targetID) return api.sendMessage("❌ Please tag, reply, or provide UID to add.", threadID, messageID);
            
            const name = await Users.getName(targetID);
            vips[targetID] = { name, addedDate: new Date().toLocaleDateString() };
            fs.writeJsonSync(dbPath, vips);
            
            return api.sendMessage(`✅ Successfully added ${name} to the VIP list!`, threadID, messageID);
        }

        // 4. VIP REMOVE (Admin Only)
        if (action === "rem" || action === "remove") {
            const targetID = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || args[1]);
            if (!vips[targetID]) return api.sendMessage("❌ User is not in the VIP list.", threadID, messageID);
            
            delete vips[targetID];
            fs.writeJsonSync(dbPath, vips);
            return api.sendMessage("✅ User removed from VIP status.", threadID, messageID);
        }

        return api.sendMessage("❓ Use: !vip [info | add | rem | list]", threadID, messageID);
    }
};
                              
