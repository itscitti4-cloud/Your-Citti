Const { getTime } = global.utils;

module.exports = {
    config: {
        name: "person",
        aliases: ["per"],
        version: "1.3",
        author: "AkHi",
        countDown: 2,
        role: 2,
        description: "Manage users with ban/unban and shared groups notification",
        category: "owner",
        guide: "{pn} ban [uid/reply/mention] <reason> | unban [uid/reply/mention] | list",
        noPermission: "You don't have permission to use this feature",
    },

    onStart: async function ({ args, message, role, event, usersData, api }) {
        const { senderID, messageReply, mentions } = event;
        const type = args[0]?.toLowerCase();

        // Anti-Spam Logic
        if (!global.userSpam) global.userSpam = new Map();
        const now = Date.now();
        const userDataSpam = global.userSpam.get(senderID) || [];
        const newSpamData = userDataSpam.filter(t => now - t < 10000);
        newSpamData.push(now);
        global.userSpam.set(senderID, newSpamData);

        if (newSpamData.length > 5) {
            const spamReason = "You are ban for repeatly command spaming";
            await usersData.set(senderID, { banned: { status: true, reason: spamReason, date: getTime("DD/MM/YYYY HH:mm:ss") } });
            const notice = this.formatNotice("Bot System", spamReason, "BAN");
            return message.reply(notice);
        }

        const adminInfo = await usersData.get(senderID);
        const adminName = adminInfo.name;

        const getTargetUID = async () => {
            if (messageReply) return messageReply.senderID;
            if (Object.keys(mentions).length > 0) return Object.keys(mentions)[0];
            if (args[1] && !isNaN(args[1])) return args[1];
            return null;
        };

        // নির্দিষ্ট ইউজারের কমন গ্রুপগুলোতে মেসেজ পাঠানোর ফাংশন
        const sendToCommonGroups = async (targetID, msg) => {
            try {
                const threadList = await api.getThreadList(50, null, ["INBOX"]);
                for (const thread of threadList) {
                    if (thread.isGroup && thread.participantIDs.includes(targetID)) {
                        api.sendMessage(msg, thread.threadID);
                    }
                }
            } catch (e) { console.error("Error sending to groups:", e); }
        };

        switch (type) {
            case "ban": {
                if (role < 2) return message.reply(this.config.noPermission);
                const targetID = await getTargetUID();
                if (!targetID) return message.reply("Please reply or mention someone.");
                
                const reason = args.slice(2).join(" ") || "Violation of bot usage rules.";
                await usersData.set(targetID, { banned: { status: true, reason, date: getTime("DD/MM/YYYY HH:mm:ss") } });
                
                const notice = this.formatNotice(adminName, reason, "BAN");
                await sendToCommonGroups(targetID, notice); 
                return message.reply(`✅ Banned user ${targetID} and notified shared groups.`);
            }

            case "unban": {
                if (role < 2) return message.reply(this.config.noPermission);
                const targetID = await getTargetUID();
                if (!targetID) return message.reply("Please reply or mention someone.");

                const reason = args.slice(2).join(" ") || "Your ban has been lifted.";
                await usersData.set(targetID, { banned: { status: false, reason: "", date: "" } });
                
                const notice = this.formatNotice(adminName, reason, "UNBAN");
                await sendToCommonGroups(targetID, notice);
                return message.reply(`✅ Unbanned user ${targetID} and notified shared groups.`);
            }

            case "list": {
                const allUsers = await usersData.getAll();
                const bannedUsers = allUsers.filter(u => u.banned?.status);
                if (bannedUsers.length === 0) return message.reply("No banned users found.");

                let msg = "🚫 Banned Users List:\n\n";
                bannedUsers.forEach((u, i) => {
                    msg += `${i + 1}. ${u.name || "Unknown"}\n    ID: ${u.userID}\n\n`;
                });
                msg += "Reply with: [number] [reason] to unban or 'all'";

                return message.reply(msg, (err, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        users: bannedUsers,
                        type: "unbanAction"
                    });
                });
            }

            default:
                return message.reply("Use: !person [ban | unban | list]");
        }
    },

    onChat: async function ({ event, usersData, api }) {
        const { senderID, threadID, body } = event;
        if (!body || !body.startsWith(global.GoatBot.config.prefix)) return;

        const userData = await usersData.get(senderID);
        if (userData && userData.banned?.status === true) {
            const reason = userData.banned.reason || "No reason provided.";
            const warningMsg = `»—💝—** ACCESS DENIED **—💝—«\n\n` +
                               `➤ Status: Banned\n` +
                               `➤ Date: ${userData.banned.date || "Unknown"}\n\n` +
                               `»———————— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ————————«\n\n` +
                               `You are restricted from using this bot.\nReason: ${reason}\n\n` +
                               `»────────────────────«\n` +
                               `Contact the Admin for more info.`;
            
            return api.sendMessage(warningMsg, threadID, event.messageID);
        }
    },

    onReply: async function ({ message, event, Reply, usersData, api }) {
        const { author, users, type } = Reply;
        if (event.senderID != author) return;

        const input = event.body.split(" ");
        const adminInfo = await usersData.get(event.senderID);
        const adminName = adminInfo.name;

        const sendToCommonGroups = async (targetID, msg) => {
            const threadList = await api.getThreadList(50, null, ["INBOX"]);
            for (const thread of threadList) {
                if (thread.isGroup && thread.participantIDs.includes(targetID)) {
                    api.sendMessage(msg, thread.threadID);
                }
            }
        };

        if (type === "unbanAction") {
            if (input[0].toLowerCase() === "all") {
                for (let user of users) {
                    await usersData.set(user.userID, { banned: { status: false } });
                    await sendToCommonGroups(user.userID, this.formatNotice(adminName, "Global Unban", "UNBAN"));
                }
                return message.reply(`✅ Unbanned all users and notified shared groups.`);
            }

            const index = parseInt(input[0]) - 1;
            const targetUser = users[index];
            if (!targetUser) return message.reply("Invalid number.");

            await usersData.set(targetUser.userID, { banned: { status: false } });
            await sendToCommonGroups(targetUser.userID, this.formatNotice(adminName, "Ban lifted by Admin", "UNBAN"));
            return message.reply(`✅ Unbanned: ${targetUser.name}`);
        }
    },

    formatNotice: function (senderName, content, type) {
        const time = getTime("hh:mm A");
        let header = type === "SYSTEM" ? "𝚂𝚈𝚂𝚃𝙴𝙼 𝙽𝙾𝚃𝙸𝙲𝙴" : "𝙰𝙳𝙼𝙸𝙽 𝙽𝙾𝚃𝙸𝙲𝙴";
        let byLabel = type === "UNBAN" ? "𝚄𝚗𝚋𝚊𝚗𝚎𝚍 𝚋𝚢" : "𝙱𝚊𝚗𝚎𝚍 𝚋𝚢";

        return `»—💝—** ${header} **—💝—«\n\n` +
               `➤ 𝐓𝐢𝐦𝐞: ${time}\n` +
               `➤ ${byLabel}: ${senderName}\n\n` +
               `»———————— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ————————«\n\n` +
               `${content}\n\n` +
               `»────────────────────«\n` +
               `🌸         Thank You Everyone        🌸`;
    }
};
