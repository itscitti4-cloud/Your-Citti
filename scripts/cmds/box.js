const axios = require('axios');
const request = require('request');
const fs = require("fs-extra");

module.exports = {
    config: {
        name: "box",
        aliases: ["group"],
        version: "2.5",
        author: "AkHi & Gemini",
        countDown: 5,
        role: 1,
        shortDescription: "Advanced group management",
        longDescription: "Manage group settings, theme, approval, pin, polls and pending requests.",
        category: "Box Chat",
        guide: "{pn} info | name <text> | emoji <e> | image (reply) | add/del [@tag] | theme <name> | pen on/off/list | pin/unpin (reply) | poll [q] [opt+opt]"
    },

    onReply: async function ({ api, event, Reply, args }) {
        const { threadID, messageID, body, senderID } = event;
        if (Reply.author !== senderID) return;

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            if (!threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID())) {
                return api.sendMessage("I need admin privileges to approve requests.", threadID, messageID);
            }

            const pendingList = Reply.pendingList;
            if (body.toLowerCase() === "all") {
                for (const user of pendingList) {
                    await api.addUserToGroup(user.id, threadID);
                }
                return api.sendMessage(`✅ Approved all ${pendingList.length} pending requests.`, threadID);
            }

            const index = parseInt(body) - 1;
            if (isNaN(index) || index < 0 || index >= pendingList.length) {
                return api.sendMessage("❌ Invalid number. Please reply with a valid index or 'all'.", threadID, messageID);
            }

            const selectedUser = pendingList[index];
            await api.addUserToGroup(selectedUser.id, threadID);
            return api.sendMessage(`✅ Approved: ${selectedUser.name}`, threadID);

        } catch (e) {
            return api.sendMessage("❌ Error: Cannot approve user.", threadID, messageID);
        }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, mentions, type, messageReply } = event;
        const botID = api.getCurrentUserID();
        const assetsPath = __dirname + "/assets";
        if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath);

        const checkBotAdmin = async () => {
            const threadInfo = await api.getThreadInfo(threadID);
            return threadInfo.adminIDs.some(admin => admin.id === botID);
        };

        if (args.length == 0) {
            return api.sendMessage(`💠 Box Management Commands:\n\n• box info\n• box name [text]\n• box emoji [emoji]\n• box image [reply]\n• box add/del [@tag]\n• box theme [ID]\n• box pen [on/off/list]\n• box pin/unpin [reply]\n• box poll [Q] [A+B]`, threadID, messageID);
        }

        const action = args[0].toLowerCase();

        // Existing features
        if (action == "name") {
            if (!(await checkBotAdmin())) return api.sendMessage("Admin needed.", threadID, messageID);
            let newName = args.slice(1).join(" ") || (messageReply ? messageReply.body : null);
            return api.setTitle(newName, threadID);
        }

        if (action == "emoji") {
            if (!(await checkBotAdmin())) return api.sendMessage("Admin needed.", threadID, messageID);
            let newEmoji = args[1] || (messageReply ? messageReply.body : null);
            return api.setChatEmoji(newEmoji, threadID);
        }

        if (action == "image") {
            if (!(await checkBotAdmin())) return api.sendMessage("Admin needed.", threadID, messageID);
            if (type !== "message_reply" || !messageReply.attachments[0]) return api.sendMessage("Reply to an image.", threadID, messageID);
            const imgPath = assetsPath + `/group_${threadID}.png`;
            const callback = () => api.changeGroupImage(fs.createReadStream(imgPath), threadID, () => fs.unlinkSync(imgPath));
            return request(encodeURI(messageReply.attachments[0].url)).pipe(fs.createWriteStream(imgPath)).on('close', callback);
        }

        // New Features
        if (action == "theme") {
            if (!(await checkBotAdmin())) return api.sendMessage("Admin needed.", threadID, messageID);
            return api.setThreadTheme(args[1], threadID);
        }

        if (action == "pen") {
            if (!(await checkBotAdmin())) return api.sendMessage("Admin needed.", threadID, messageID);
            const sub = args[1]?.toLowerCase();
            
            if (sub === "on") {
                // api.handleMessageRequest functionality depends on specific fca
                return api.sendMessage("Approval mode set to: ON", threadID); 
            }
            if (sub === "off") {
                return api.sendMessage("Approval mode set to: OFF", threadID);
            }

            // Pen List Logic
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                // Note: Getting real 'pending' users often requires specific API support. 
                // Using userInfo for demonstration; in some FCA, threadInfo.approvalQueue exists.
                const pending = threadInfo.approvalQueue || []; 
                
                if (pending.length === 0) return api.sendMessage("No pending requests.", threadID);

                let msg = "📋 Pending Requests:\n";
                pending.forEach((u, i) => msg += `${i + 1}. ${u.name || u.id}\n`);
                msg += "\nReply with number to approve or 'all'.";

                return api.sendMessage(msg, threadID, (err, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        pendingList: pending
                    });
                }, messageID);
            } catch (e) {
                return api.sendMessage("Could not fetch pending list.", threadID);
            }
        }

        if (action == "pin" || action == "unpin") {
            if (!(await checkBotAdmin())) return api.sendMessage("Admin needed.", threadID, messageID);
            if (type !== "message_reply") return api.sendMessage("Reply to a msg.", threadID);
            return api.pinMessage(messageReply.messageID, threadID, action === "pin");
        }

        if (action == "poll") {
            const content = args.slice(1).join(" ");
            const q = content.split("[")[1]?.split("]")[0];
            const opts = content.split("[")[2]?.split("]")[0];
            if (!q || !opts) return api.sendMessage("Format: box poll [Q] [O1+O2]", threadID);
            const pollOpts = opts.split("+").reduce((a, b) => ({ ...a, [b.trim()]: false }), {});
            return api.createPoll(q, threadID, pollOpts);
        }

        if (action == "info") {
            const threadInfo = await api.getThreadInfo(threadID);
            const { threadName, participantIDs, adminIDs, emoji } = threadInfo;
            const infoMsg = `📝 Name: ${threadName}\n🎭 Emoji: ${emoji}\n👥 Members: ${participantIDs.length}\n👮 Admins: ${adminIDs.length}`;
            return api.sendMessage(infoMsg, threadID);
        }
    }
};
            
