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
        aliases: ["wm", "wrdmntr"]
        version: "3.5.0",
        role: 0, // আমরা ভেতরে ম্যানুয়ালি ১ এবং ২ রোল চেক করবো
        author: "AkHi",
        description: "Automatic badword filter with MongoDB (Supports Group & Bot Admin)",
        category: "Box",
        guide: "{pn} on | off | add [words] | active | unban"
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
                    api.removeUserFromGroup(user.userFbId, threadID);
                    api.sendMessage(`🚫 Banned user (${user.userFbId}) detected and removed.`, threadID);
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
        const { threadID, messageID, type, messageReply, mentions, body } = event;
        
        // --- Role Check: Group Admin (1) OR Bot Admin (2) ---
        if (role < 1) {
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

            case "active":
                if (type !== "message_reply") return api.sendMessage("Please reply to a message to take action.", threadID);
                return await handleViolation(api, messageReply, data, messageReply.senderID);

            case "unban":
                let targetID = type === "message_reply" ? messageReply.senderID : (Object.keys(mentions)[0] || args[1]);
                if (!targetID) return api.sendMessage("Reply or mention someone to unban.", threadID);
                data.bannedUsers = data.bannedUsers.filter(id => id !== targetID);
                await data.save();
                return api.sendMessage(`✅ User ${targetID} has been unbanned.`, threadID);

            default:
                return api.sendMessage("Usage: !wordmonitor [on/off/add/active/unban]", threadID);
        }
    }
};

async function handleViolation(api, event, data, targetID) {
    const { threadID, messageID } = event;
    
    // Delete message
    api.unsendMessage(messageID);
    
    let currentWarns = (data.warnings.get(targetID) || 0) + 1;

    if (currentWarns >= 3) {
        data.bannedUsers.push(targetID);
        data.warnings.set(targetID, 0);
        await data.save();
        api.removeUserFromGroup(targetID, threadID);
        return api.sendMessage(`❌ User ${targetID} Banned! Reached 3/3 warnings.`, threadID);
    } else {
        data.warnings.set(targetID, currentWarns);
        await data.save();
        return api.sendMessage(`⚠️ Warning ${currentWarns}/3! Prohibited language. [UID: ${targetID}]`, threadID);
    }
}
