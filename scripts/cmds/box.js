const axios = require('axios');
const request = require('request');
const fs = require("fs-extra");

module.exports = {
    config: {
        name: "box",
        aliases: ["box"],
        version: "1.3",
        author: "AkHi",
        countDown: 5,
        role: 1,
        shortDescription: "Group management and info",
        longDescription: "Manage group settings like name, emoji, image, and view group info.",
        category: "Box Chat",
        guide: "{pn} name <name>\n{pn} emoji <emoji>\n{pn} image (reply)\n{pn} add [@tag]\n{pn} del [@tag]\n{pn} info"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, mentions, type, messageReply } = event;
        const botID = api.getCurrentUserID();

        // Ensure assets folder exists
        const assetsPath = __dirname + "/assets";
        if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath);

        if (args.length == 0) {
            return api.sendMessage(`Available Options:\n\n• box name [text]\n• box emoji [emoji]\n• box image [reply]\n• box add [@tag]\n• box del [@tag]\n• box info`, threadID, messageID);
        }

        // Helper function to check if bot is admin
        const checkBotAdmin = async () => {
            const threadInfo = await api.getThreadInfo(threadID);
            return threadInfo.adminIDs.some(admin => admin.id === botID);
        };

        // Logic for Name
        if (args[0] == "name") {
            if (!(await checkBotAdmin())) return api.sendMessage("I need admin privileges to change the group name.", threadID, messageID);
            let newName = args.slice(1).join(" ");
            if (!newName && messageReply) newName = messageReply.body;
            if (!newName) return api.sendMessage("Please provide a name.", threadID, messageID);
            return api.setTitle(newName, threadID);
        }

        // Logic for Emoji
        if (args[0] == "emoji") {
            if (!(await checkBotAdmin())) return api.sendMessage("I need admin privileges to change the group emoji.", threadID, messageID);
            let newEmoji = args[1];
            if (!newEmoji && messageReply) newEmoji = messageReply.body;
            if (!newEmoji) return api.sendMessage("Please provide an emoji.", threadID, messageID);
            return api.setChatEmoji(newEmoji, threadID);
        }

        // Logic for Add/Del Admin
        if (args[0] == "add" || args[0] == "del") {
            if (!(await checkBotAdmin())) return api.sendMessage("I need admin privileges to change admin status.", threadID, messageID);
            const status = args[0] === "add";
            if (Object.keys(mentions).length == 0) return api.sendMessage("Please tag someone.", threadID, messageID);
            for (let id in mentions) {
                await api.changeAdminStatus(threadID, id, status);
            }
            return api.sendMessage(`Admin status ${status ? "granted" : "revoked"} successfully.`, threadID);
        }

        // Logic for Image
        if (args[0] == "image") {
            if (!(await checkBotAdmin())) return api.sendMessage("I need admin privileges to change the group image.", threadID, messageID);
            if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length == 0) {
                return api.sendMessage("Please reply to an image.", threadID, messageID);
            }
            const imgPath = assetsPath + `/group_${threadID}.png`;
            const callback = () => api.changeGroupImage(fs.createReadStream(imgPath), threadID, () => fs.unlinkSync(imgPath));
            return request(encodeURI(messageReply.attachments[0].url)).pipe(fs.createWriteStream(imgPath)).on('close', callback);
        }

        // Optimized Group Info (Admin status not required for viewing info)
        if (args[0] == "info") {
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                const { threadName, participantIDs, adminIDs, emoji, messageCount, approvalMode } = threadInfo;

                let maleCount = 0, femaleCount = 0;
                threadInfo.userInfo.forEach(u => {
                    if (u.gender === "MALE") maleCount++;
                    else if (u.gender === "FEMALE") femaleCount++;
                });

                const adminIdsOnly = adminIDs.map(a => a.id);
                const adminUsers = await api.getUserInfo(adminIdsOnly);
                let adminList = adminIdsOnly.map(id => `• ${adminUsers[id].name}`).join("\n");

                const infoMsg = `✨ 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 ✨\n` +
                    `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n` +
                    `📝 𝗡𝗮𝗺𝗲: ${threadName || "No Name"}\n` +
                    `🆔 𝗜𝗗: ${threadID}\n` +
                    `🎭 𝗘𝗺𝗼𝒋𝗶: ${emoji || "Default"}\n` +
                    `🛡️ 𝗔𝗽𝗽𝗿𝗼𝘃𝗮𝗹: ${approvalMode ? "✅ Enabled" : "❎ Disabled"}\n\n` +
                    `👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${participantIDs.length}\n` +
                    `🙎 𝐌𝐚𝐥𝐞: ${maleCount} | 🙎‍♀️ 𝐅𝐞𝐦𝐚𝐥𝐞: ${femaleCount}\n` +
                    `👮 𝗔𝗱𝗺𝗶𝗻𝘀: ${adminIDs.length}\n` +
                    `👮 𝗔𝗱𝗺𝗶𝗻 𝗟𝗶𝘀𝘁:\n${adminList}\n` +
                    `📊 𝗠𝗲𝘀𝘀𝗮𝗴𝗲𝘀: ${messageCount}\n` +
                    `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
                    `👑 𝗢𝘄𝗻𝗲𝗿: Nawab And AkHi`;

                if (threadInfo.imageSrc) {
                    const imgPath = assetsPath + `/info_${threadID}.png`;
                    const callback = () => api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(imgPath) }, threadID, () => fs.unlinkSync(imgPath), messageID);
                    return request(encodeURI(threadInfo.imageSrc)).pipe(fs.createWriteStream(imgPath)).on('close', callback);
                } else {
                    return api.sendMessage(infoMsg, threadID, messageID);
                }
            } catch (e) {
                return api.sendMessage("Error fetching group info.", threadID, messageID);
            }
        }
    }
};
