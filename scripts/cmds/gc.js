const { getTime } = global.utils;

module.exports = {
    config: {
        name: "gc",
        version: "2.7",
        author: "AkHi",
        countDown: 2,
        role: 2,
        description: "Manage group chats with list, ban, unban and auto-spam protection",
        category: "owner",
        guide: "{pn} list | ban <tid> <reason> | unban <tid> | banlist",
        noPermission: "You don't have permission to use this feature",
    },

    onStart: async function ({ args, threadsData, message, role, event, usersData, api }) {
        const { threadID, messageID, senderID } = event;
        const type = args[0]?.toLowerCase();

        // Anti-Spam Logic
        if (!global.gcSpam) global.gcSpam = new Map();
        const now = Date.now();
        const userSpam = global.gcSpam.get(senderID) || [];
        const newSpamData = userSpam.filter(t => now - t < 10000);
        newSpamData.push(now);
        global.gcSpam.set(senderID, newSpamData);

        if (newSpamData.length > 5) {
            await threadsData.set(threadID, { banned: { status: true, reason: "Auto-ban: Spamming Command", date: getTime("DD/MM/YYYY HH:mm:ss") } });
            const notice = this.formatNotice("Bot System", "This group is ban for repeatly spaming.", "SYSTEM");
            return api.sendMessage(notice, threadID);
        }

        const adminInfo = await usersData.get(senderID);
        const adminName = adminInfo.name;

        switch (type) {
            case "list": {
                // বর্তমানে বট যে গ্রুপগুলোতে জয়েন আছে শুধু সেগুলো নেওয়া হচ্ছে
                const list = await api.getThreadList(100, null, ["INBOX"]);
                const activeThreads = list.filter(t => t.isGroup && t.threadID !== threadID);
                
                let msg = "🌐 Group List:\n\n";
                activeThreads.forEach((t, i) => {
                    msg += `${i + 1}. ${t.name || "Unknown"}\n    ${t.threadID}\n\n`;
                });
                msg += "Reply with: [number] info | ban [reason] | unban | join";
                
                return message.reply(msg, (err, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        threads: activeThreads,
                        type: "listAction"
                    });
                });
            }

            case "ban": {
                if (role < 2) return message.reply(this.config.noPermission);
                const tid = args[1] || threadID;
                const reason = args.slice(2).join(" ") || "বারবার স্পাম করার জন্য ব্যান করলাম।";
                await threadsData.set(tid, { banned: { status: true, reason, date: getTime("DD/MM/YYYY HH:mm:ss") } });
                const notice = this.formatNotice(adminName, reason, "BAN");
                api.sendMessage(notice, tid);
                return message.reply(`✅ Banned group ${tid}`);
            }

            case "unban": {
                if (role < 2) return message.reply(this.config.noPermission);
                const tid = args[1] || threadID;
                const reason = args.slice(2).join(" ") || "আর স্পাম করো না কেউ।";
                await threadsData.set(tid, { banned: { status: false, reason: "", date: "" } });
                const notice = this.formatNotice(adminName, reason, "UNBAN");
                api.sendMessage(notice, tid);
                return message.reply(`✅ Unbanned group ${tid}`);
            }

            case "banlist": {
                const allThreads = await threadsData.getAll();
                const bannedThreads = allThreads.filter(t => t.banned?.status);
                if (bannedThreads.length === 0) return message.reply("No banned groups found.");

                let msg = "🚫 Banned Groups:\n\n";
                bannedThreads.forEach((t, i) => {
                    msg += `${i + 1}. ${t.threadName || "Unknown"}\n    ${t.threadID}\n\n`;
                });
                msg += "Reply with: [number] [reason to unban]";

                return message.reply(msg, (err, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        threads: bannedThreads,
                        type: "unbanAction"
                    });
                });
            }

            default:
                return message.reply("Use: !gc [list | ban | unban | banlist]");
        }
    },

    onReply: async function ({ message, event, Reply, threadsData, usersData, api }) {
        const { author, threads, type } = Reply;
        if (event.senderID != author) return;

        const input = event.body.split(" ");
        const index = parseInt(input[0]) - 1;
        const action = input[1]?.toLowerCase();
        const targetThread = threads[index];

        if (!targetThread) return message.reply("Invalid number.");
        const tid = targetThread.threadID;
        const adminInfo = await usersData.get(event.senderID);
        const adminName = adminInfo.name;

        if (type === "listAction") {
            if (action === "info") {
                const threadInfo = await api.getThreadInfo(tid);
                const adminIDs = threadInfo.adminIDs.map(a => a.id);
                let admins = [];
                for (let id of adminIDs) {
                    const info = await usersData.get(id);
                    admins.push(info?.name || id);
                }
                
                const msg = `» ID: ${tid}\n» Name: ${threadInfo.threadName}\n» Members: ${threadInfo.participantIDs.length}\n» Admins: ${admins.join(", ")}`;
                return message.reply({ body: msg, attachment: await global.utils.getStreamFromURL(threadInfo.imageSrc || "") });
            } 
            
            if (action === "ban") {
                const reason = input.slice(2).join(" ") || "বারবার স্পাম করার জন্য ব্যান করলাম।";
                await threadsData.set(tid, { banned: { status: true, reason } });
                api.sendMessage(this.formatNotice(adminName, reason, "BAN"), tid);
                return message.reply(`Banned: ${targetThread.name || targetThread.threadName}`);
            }

            if (action === "unban") {
                const reason = input.slice(2).join(" ") || "আর স্পাম করো না কেউ।";
                await threadsData.set(tid, { banned: { status: false } });
                api.sendMessage(this.formatNotice(adminName, reason, "UNBAN"), tid);
                return message.reply(`Unbanned: ${targetThread.name || targetThread.threadName}`);
            }

            if (action === "join") {
                api.addUserToGroup(event.senderID, tid, (err) => {
                    if (err) return message.reply("Cannot add you to this group. Check if I'm still there.");
                    return message.reply(`Added you to: ${targetThread.name || targetThread.threadName}`);
                });
            }
        }

        if (type === "unbanAction") {
            const reason = input.slice(1).join(" ") || "আর স্পাম করো না কেউ।";
            await threadsData.set(tid, { banned: { status: false } });
            api.sendMessage(this.formatNotice(adminName, reason, "UNBAN"), tid);
            return message.reply(`Unbanned & Notice sent to: ${targetThread.threadName}`);
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
                    
