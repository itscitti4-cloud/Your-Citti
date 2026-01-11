const axios = require('axios');
const request = require('request');
const fs = require("fs-extra");

module.exports = {
    config: {
        name: "box",
        aliases: ["group"],
        version: "3.5",
        author: "AkHi",
        countDown: 5,
        role: 1,
        shortDescription: "Advanced group management",
        longDescription: "Manage group settings.",
        category: "Box Chat",
        guide: "{pn} info | name <text> | emoji <e> | image (reply) | add/del [@tag] | theme [ID/reply image] | pen on/off/list | pin/unpin (reply) | poll [q] [opt+opt]"
    },

    onReply: async function ({ api, event, Reply }) {
        const { threadID, messageID, body, senderID } = event;
        if (Reply.author !== senderID) return;

        try {
            // Real-time admin check for approval
            const threadInfo = await api.getThreadInfo(threadID);
            const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
            
            if (!isBotAdmin) return api.sendMessage("❌ I'm no longer an admin. Approval failed.", threadID, messageID);

            const pendingList = Reply.pendingList;
            if (body.toLowerCase() === "all") {
                for (const user of pendingList) {
                    await api.addUserToGroup(user.id, threadID);
                }
                return api.sendMessage(`✅ Approved all pending requests.`, threadID);
            }

            const index = parseInt(body) - 1;
            if (isNaN(index) || index < 0 || index >= pendingList.length) {
                return api.sendMessage("❌ Invalid selection.", threadID, messageID);
            }

            const selectedUser = pendingList[index];
            await api.addUserToGroup(selectedUser.id, threadID);
            return api.sendMessage(`✅ Approved: ${selectedUser.name}`, threadID);
        } catch (e) {
            return api.sendMessage("❌ Error in approval process.", threadID);
        }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, mentions, type, messageReply } = event;
        const botID = api.getCurrentUserID();
        const assetsPath = __dirname + "/assets";
        if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath);

        // সরাসরি ফেসবুক থেকে রিয়েল-টাইম এডমিন চেক করার ফাংশন
        const checkBotAdmin = async () => {
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                return threadInfo.adminIDs.some(admin => admin.id === botID);
            } catch (e) {
                return false;
            }
        };

        if (args.length == 0) {
            return api.sendMessage(`💠 Box Management Commands:\n\n• box info\n• box name [text]\n• box emoji [emoji]\n• box image [reply]\n• box add/del [@tag]\n• box theme [ID/Reply Image]\n• box pen [on/off/list]\n• box pin/unpin [reply]\n• box poll [Q] [A+B]`, threadID, messageID);
        }

        const action = args[0].toLowerCase();

        // Admin check for sensitive actions
        const adminRequiredActions = ["name", "emoji", "image", "theme", "pin", "unpin", "pen", "add", "del"];
        if (adminRequiredActions.includes(action)) {
            const isAdmin = await checkBotAdmin();
            if (!isAdmin) return api.sendMessage("⚠️ Error: I need to be an ADMIN to perform this action.", threadID, messageID);
        }

        // 1. Name Change
        if (action == "name") {
            let newName = args.slice(1).join(" ") || (messageReply ? messageReply.body : null);
            if (!newName) return api.sendMessage("Provide a name.", threadID);
            return api.gcname(newName, threadID);
        }

        // 2. Emoji Change
        if (action == "emoji") {
            let newEmoji = args[1] || (messageReply ? messageReply.body : null);
            if (!newEmoji) return api.sendMessage("Provide an emoji.", threadID);
            return api.emoji(newEmoji, threadID);
        }

        // 3. Image Change
        if (action == "image") {
            if (type !== "message_reply" || !messageReply.attachments[0]) return api.sendMessage("Reply to an image.", threadID);
            const imgPath = assetsPath + `/group_${threadID}.png`;
            const callback = () => api.changeGroupImage(fs.createReadStream(imgPath), threadID, () => fs.unlinkSync(imgPath));
            return request(encodeURI(messageReply.attachments[0].url)).pipe(fs.createWriteStream(imgPath)).on('close', callback);
        }

        // 4. Theme
        if (action == "theme") {
            if (type === "message_reply" && messageReply.attachments[0]) {
                return api.createAITheme(messageReply.attachments[0].url, threadID);
            }
            if (!args[1]) return api.sendMessage("Provide Theme ID or reply to an image.", threadID);
            return api.setThreadTheme(args[1], threadID);
        }

        // 5. Pin/Unpin
        if (action == "pin" || action == "unpin") {
            if (type !== "message_reply") return api.sendMessage("Reply to a message to pin/unpin.", threadID);
            return api.pinMessage(messageReply.messageID, threadID, action);
        }

        // 6. Poll
        if (action == "poll") {
            const content = args.slice(1).join(" ");
            const q = content.split("[")[1]?.split("]")[0];
            const optsRaw = content.split("[")[2]?.split("]")[0];
            if (!q || !optsRaw) return api.sendMessage("Format: box poll [Q] [O1 + O2]", threadID);
            const optionsArray = optsRaw.split("+").map(opt => opt.trim());
            if (optionsArray.length < 2) return api.sendMessage("Need at least 2 options.", threadID);
            const optionsObj = optionsArray.reduce((a, b) => ({ ...a, [b]: false }), {});
            return api.createPoll(q, threadID, optionsObj);
        }

        // 7. Pen (Approval)
        if (action == "pen") {
            const sub = args[1]?.toLowerCase();
            if (sub === "on") return api.handleMessageRequest(threadID, true);
            if (sub === "off") return api.handleMessageRequest(threadID, false);

            try {
                const threadInfo = await api.getThreadInfo(threadID);
                const pending = threadInfo.approvalQueue || [];
                if (pending.length === 0) return api.sendMessage("No pending requests.", threadID);

                let msg = "📋 Pending List:\n";
                pending.forEach((u, i) => msg += `${i + 1}. ${u.name || u.id}\n`);
                msg += "\nReply with index or 'all' to approve.";

                return api.sendMessage(msg, threadID, (err, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        pendingList: pending
                    });
                }, messageID);
            } catch (e) { return api.sendMessage("Error fetching pending list.", threadID); }
        }

        // 8. Info
        if (action == "info") {
            const threadInfo = await api.getThreadInfo(threadID);
            const msg = `✨ 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢 ✨\n▬▬▬▬▬▬▬▬▬▬▬\n📝 𝗡𝗮𝗺𝗲: ${threadInfo.threadName}\n🆔 𝗜𝗗: ${threadID}\n🎭 𝗘𝗺𝗼𝗷𝗶: ${threadInfo.emoji || "Default"}\n👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${threadInfo.participantIDs.length}\n👮 𝗔𝗱𝗺𝗶𝗻𝘀: ${threadInfo.adminIDs.length}\n▬▬▬▬▬▬▬▬▬▬▬`;
            return api.sendMessage(msg, threadID);
        }

        // 9. Admin Status (add/del)
        if (action == "add" || action == "del") {
            const status = action === "add";
            if (Object.keys(mentions).length == 0) return api.sendMessage("Please tag someone.", threadID, messageID);
            for (let id in mentions) {
                await api.changeAdminStatus(threadID, id, status);
            }
            return api.sendMessage(`✅ Admin status ${status ? "granted" : "revoked"}.`, threadID);
        }
    }
};
        
