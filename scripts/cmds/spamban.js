const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "spamban",
        aliases: ["unspam", "spamlist"],
        version: "2.1",
        author: "AkHi",
        countDown: 5,
        role: 2,
        description: {
            en: "Manage auto spam-banned threads (unban only)"
        },
        category: "owner",
        guide: {
            en: "   {pn} list: View list of spam-banned threads"
                + "\n   {pn} unban <threadID>: Unban a spam-banned thread"
                + "\n   {pn} info: View spam detection config"
        }
    },

    onStart: async function ({ message, args, api, event, globalData }) {
        const { threadID: currentThreadID } = event;
        const spamConfig = global.GoatBot.config.spamProtection || {
            commandThreshold: 8,
            timeWindow: 10,
            banDuration: 24
        };

        const spamBannedThreads = await globalData.get("spamBannedThreads", "data", {});

        const now = Date.now();
        let hasExpired = false;
        for (const tid in spamBannedThreads) {
            if (spamBannedThreads[tid].expireTime <= now) {
                delete spamBannedThreads[tid];
                hasExpired = true;
            }
        }
        if (hasExpired) {
            await globalData.set("spamBannedThreads", spamBannedThreads, "data");
        }

        switch (args[0]) {
            case "list":
            case "-l": {
                const threadIDs = Object.keys(spamBannedThreads);
                if (threadIDs.length === 0) {
                    return message.reply("≡ | No spam-banned threads");
                }

                const limit = 10;
                const page = parseInt(args[1]) || 1;
                const start = (page - 1) * limit;
                const end = page * limit;
                const data = threadIDs.slice(start, end);
                
                let msg = "";
                for (let i = 0; i < data.length; i++) {
                    const tid = data[i];
                    const banInfo = spamBannedThreads[tid];
                    const expireTime = moment(banInfo.expireTime)
                        .tz(global.GoatBot.config.timeZone || "Asia/Ho_Chi_Minh")
                        .format("HH:mm:ss DD/MM/YYYY");
                    const threadName = banInfo.threadName || "Unknown";
                    msg += `${start + i + 1}. ${threadName}\n   ID: ${tid}\n   Expires: ${expireTime}\n\n`;
                }

                return message.reply(`≡ | Spam banned threads (page ${page}/${Math.ceil(threadIDs.length / limit)}):\n\n${msg}`);
            }

            case "unban":
            case "-u": {
                const targetID = args[1];
                if (!targetID || isNaN(targetID)) {
                    return message.reply("⚠ | Please enter a valid threadID");
                }

                if (!spamBannedThreads[targetID]) {
                    return message.reply("⚠ | This thread is not spam-banned");
                }

                // সরাসরি ফেসবুক থেকে রিয়েল-টাইম ডাটা চেক (বট অ্যাডমিন কিনা)
                try {
                    const threadInfo = await api.getThreadInfo(targetID);
                    const botID = api.getCurrentUserID();
                    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
                    
                    if (!isAdmin) {
                        return message.reply(`✅ | Unbanned thread ${targetID}, but note: I am not an admin in that group.`);
                    }
                } catch (e) {
                    // যদি গ্রুপ থেকে বের করে দেওয়া হয় বা তথ্য না পাওয়া যায়
                }

                const threadName = spamBannedThreads[targetID].threadName || targetID;
                delete spamBannedThreads[targetID];
                await globalData.set("spamBannedThreads", spamBannedThreads, "data");

                return message.reply(`✅ | Unbanned thread ${threadName} from spam ban`);
            }

            case "info":
            case "-i": {
                const threadCount = Object.keys(spamBannedThreads).length;
                return message.reply(`📊 | Spam Detection Config:\n• Threshold: ${spamConfig.commandThreshold} commands in ${spamConfig.timeWindow} seconds\n• Ban duration: ${spamConfig.banDuration} hours\n• Total banned threads: ${threadCount}`);
            }

            default: {
                return message.reply(
                    "📋 | Spam Ban Management\n\n" +
                    "Usage:\n" +
                    "• list - View banned threads\n" +
                    "• unban <threadID> - Unban a thread\n" +
                    "• info - View spam detection config\n\n" +
                    "Note: Threads are auto-banned when users spam commands too quickly."
                );
            }
        }
    }
};
