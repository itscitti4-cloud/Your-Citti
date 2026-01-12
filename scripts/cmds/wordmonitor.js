const mongoose = require('mongoose');

// MongoDB Connection
const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schema for Badwords
const monitorSchema = new mongoose.Schema({
    threadID: String,
    status: { type: Boolean, default: true },
    badWords: { type: [String], default: ["test"] },
    warnings: { type: Map, of: Number, default: {} },
    bannedUsers: { type: [String], default: [] }
}, { collection: 'Badwords' });

const Monitor = mongoose.model('WordMonitor', monitorSchema);

module.exports = {
    config: {
        name: "wordmonitor",
        aliases: ["wm", "wrdmntr"],
        version: "3.5.3",
        role: 0, // Base role is 0, logic handles specific admin checks
        author: "AkHi",
        description: "Automatic badword filter (Supports Group & Bot Admin)",
        category: "Box",
        guide: "{pn} on | off | add [words] | active | unban | list | rem [word]"
    },

    onChat: async function ({ api, event }) {
        const { threadID, messageID, senderID, body, logMessageType, logMessageData } = event;
        
        let data = await Monitor.findOne({ threadID });
        if (!data) data = await Monitor.create({ threadID });

        // 1. Auto-Kick for Banned Users
        if (logMessageType === "log:subscribe") {
            const addedParticipants = logMessageData.addedParticipants;
            for (let user of addedParticipants) {
                if (data.bannedUsers.includes(user.userFbId)) {
                    const threadInfo = await api.getThreadInfo(threadID);
                    if (threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID())) {
                        api.removeUserFromGroup(user.userFbId, threadID);
                        api.sendMessage(`🚫 Banned user (${user.userFbId}) detected and removed.`, threadID);
                    }
                }
            }
        }

        if (!data.status || !body) return;

        // 2. Badword Detection
        const hasBadWord = data.badWords.some(word => body.toLowerCase().includes(word.toLowerCase()));

        if (hasBadWord) {
            return await handleViolation(api, event, data, senderID);
        }
    },

    onStart: async function ({ api, event, args, role }) {
        const { threadID, messageID, type, messageReply, mentions, body, senderID } = event;
        
        // --- Custom Admin Check (Group Admin OR Bot Admin) ---
        const threadInfo = await api.getThreadInfo(threadID);
        const isGroupAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
        const isBotAdmin = role >= 2; // Usually role 2 is for Bot Admins

        if (!isGroupAdmin && !isBotAdmin) {
            return api.sendMessage("❌ Only Group Admins or Bot Admins can use this command.", threadID, messageID);
        }

        let data = await Monitor.findOne({ threadID });
        if (!data) data = await Monitor.create({ threadID });

        const action = args[0]?.toLowerCase();

        switch (action) {
            case "on":
                data.status = true;
                await data.save();
                return api.sendMessage("✅ WordMonitor has been turned ON.", threadID);

            case "off":
                data.status = false;
                await data.save();
                return api.sendMessage("❌ WordMonitor has been turned OFF.", threadID);

            case "add":
                const wordInput = body.split('add')[1]?.replace(/[\[\]]/g, '');
                if (!wordInput) return api.sendMessage("Usage: add [word1, word2]", threadID);
                const words = wordInput.split(',').map(w => w.trim().toLowerCase());
                data.badWords.push(...words);
                data.badWords = [...new Set(data.badWords)];
                await data.save();
                return api.sendMessage(`✅ Added ${words.length} words to the database.`, threadID);

            case "list":
                if (data.badWords.length === 0) return api.sendMessage("⚠️ No bad words found in the database.", threadID);
                return api.sendMessage(`📋 Current Bad Words:\n\n${data.badWords.join(", ")}`, threadID);

            case "rem":
            case "remove":
                const wordToRemove = args.slice(1).join(" ").toLowerCase();
                if (!wordToRemove) return api.sendMessage("Usage: rem [word]", threadID);
                if (!data.badWords.includes(wordToRemove)) return api.sendMessage(`❌ "${wordToRemove}" is not in the list.`, threadID);
                data.badWords = data.badWords.filter(w => w !== wordToRemove);
                await data.save();
                return api.sendMessage(`✅ Removed "${wordToRemove}" from the database.`, threadID);

            case "active":
                if (type !== "message_reply") return api.sendMessage("Please reply to a message to take action manually.", threadID);
                return await handleViolation(api, messageReply, data, messageReply.senderID);

            case "unban":
                let targetID = type === "message_reply" ? messageReply.senderID : (Object.keys(mentions)[0] || args[1]);
                if (!targetID) return api.sendMessage("Reply or mention someone to unban.", threadID);
                data.bannedUsers = data.bannedUsers.filter(id => id !== targetID);
                await data.save();
                return api.sendMessage(`✅ User ${targetID} has been unbanned.`, threadID);

            default:
                return api.sendMessage("Usage: !wm [on/off/add/list/rem/active/unban]", threadID);
        }
    }
};

async function handleViolation(api, event, data, targetID) {
    const { threadID, messageID } = event;
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isBotAdminInGroup = threadInfo.adminIDs.some(admin => admin.id === botID);

    try {
        await api.unsendMessage(messageID);
    } catch (e) { console.error("Unsend failed:", e); }
    
    let currentWarns = (data.warnings.get(targetID) || 0) + 1;

    if (currentWarns >= 3) {
        data.bannedUsers.push(targetID);
        data.warnings.set(targetID, 0);
        await data.save();

        if (isBotAdminInGroup) {
            api.removeUserFromGroup(targetID, threadID);
            return api.sendMessage(`❌ User ${targetID} Banned! Reached 3/3 warnings.`, threadID);
        } else {
            return api.sendMessage(`⚠️ User ${targetID} reached 3/3 warnings, but I am not an admin to kick them.`, threadID);
        }
    } else {
        data.warnings.set(targetID, currentWarns);
        await data.save();
        return api.sendMessage(`⚠️ Warning ${currentWarns}/3! Prohibited language. [UID: ${targetID}]`, threadID);
    }
}
