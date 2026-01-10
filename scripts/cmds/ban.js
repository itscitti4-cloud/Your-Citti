const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "ban",
        version: "1.8",
        author: "AkHi & Nawab",
        countDown: 5,
        role: 1,
        description: "Ban user from box chat with real-time admin check",
        category: "box chat",
        guide: "{pn} [@tag|uid|fb link|reply] [<reason>]: Ban user\n   {pn} unban [@tag|uid|fb link|reply]: Unban user\n   {pn} list: View banned members list\n   {pn} check: Kick currently present banned members"
    },

    onStart: async function ({ message, event, args, threadsData, usersData, api }) {
        const { senderID, threadID, mentions, messageReply } = event;
        let target;
        let reason = "";

        // সরাসরি ফেসবুক থেকে লেটেস্ট গ্রুপ ডাটা এবং অ্যাডমিন লিস্ট সংগ্রহ
        const threadInfo = await api.getThreadInfo(threadID);
        const botID = api.getCurrentUserID();
        const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);
        const groupAdmins = threadInfo.adminIDs.map(admin => admin.id);

        const dataBanned = await threadsData.get(threadID, 'data.banned_ban', []);

        // --- ১. আনব্যান লজিক (UNBAN LOGIC) ---
        if (args[0] == 'unban') {
            let unbanTarget;
            if (messageReply) unbanTarget = messageReply.senderID;
            else if (Object.keys(mentions).length > 0) unbanTarget = Object.keys(mentions)[0];
            else if (args[1]?.startsWith('https')) unbanTarget = await findUid(args[1]);
            else if (!isNaN(args[1])) unbanTarget = args[1];

            if (!unbanTarget) return message.reply("⚠ | Please tag, reply, or provide a link/UID to unban.");

            const index = dataBanned.findIndex(item => item.id == unbanTarget);
            if (index == -1) return message.reply(`⚠ | User with ID ${unbanTarget} is not banned in this chat.`);

            dataBanned.splice(index, 1);
            await threadsData.set(threadID, dataBanned, 'data.banned_ban');
            const name = await usersData.getName(unbanTarget) || "Facebook User";
            return message.reply(`✓ | Unbanned ${name} successfully!`);
        }

        // --- ২. লিস্ট লজিক (LIST LOGIC) ---
        if (args[0] == 'list') {
            if (!dataBanned.length) return message.reply("≡ | There are no banned members in this chat.");
            let msg = '≡ | List of banned members:\n\n';
            for (let i = 0; i < dataBanned.length; i++) {
                const name = await usersData.getName(dataBanned[i].id) || "Facebook User";
                msg += `${i + 1}/ ${name} (${dataBanned[i].id})\nReason: ${dataBanned[i].reason}\nTime: ${dataBanned[i].time}\n\n`;
            }
            return message.reply(msg);
        }

        // --- ৩. চেক লজিক (CHECK LOGIC) ---
        if (args[0] == 'check') {
            if (!isBotAdmin) return message.reply("⚠ | I need admin power to check and kick members.");
            let count = 0;
            for (const user of dataBanned) {
                if (event.participantIDs.includes(user.id)) {
                    await api.removeUserFromGroup(user.id, threadID);
                    count++;
                }
            }
            return message.reply(`✅ Checked. Kicked ${count} banned members found in the group.`);
        }

        // --- ৪. ব্যান টার্গেট ডিটেকশন (BAN TARGETING) ---
        if (messageReply) {
            target = messageReply.senderID;
            reason = args.join(' ');
        } 
        else if (Object.keys(mentions).length > 0) {
            target = Object.keys(mentions)[0];
            reason = args.join(' ').replace(mentions[target], '').trim();
        } 
        else if (args.find(a => a.startsWith('https'))) {
            const link = args.find(a => a.startsWith('https'));
            target = await findUid(link);
            reason = args.join(' ').replace(link, '').trim();
        } 
        else if (args.find(a => !isNaN(a) && a.length > 10)) {
            target = args.find(a => !isNaN(a) && a.length > 10);
            reason = args.join(' ').replace(target, '').trim();
        }

        // --- ৫. কন্ডিশন চেক এবং একশন ---
        if (!target) return message.reply("⚠ | Please tag, reply, or provide a link to ban.");
        if (target == senderID) return message.reply("⚠ | You can't ban yourself!");
        if (groupAdmins.includes(target)) return message.reply("✗ | You can't ban an administrator!");
        if (dataBanned.some(item => item.id == target)) return message.reply("✗ | This person is already banned!");

        const name = await usersData.getName(target) || "Facebook User";
        const time = moment().tz("Asia/Dhaka").format('HH:mm:ss DD/MM/YYYY');
        
        const newBan = { id: target, time, reason: reason || "No reason" };
        dataBanned.push(newBan);
        
        await threadsData.set(threadID, dataBanned, 'data.banned_ban');
        
        message.reply(`✓ | Banned ${name} from box chat!`, () => {
            if (!isBotAdmin) {
                message.send("⚠ | I've added them to the ban list, but I can't kick them because I'm not an admin (or my database is outdated).");
            } else {
                api.removeUserFromGroup(target, threadID, (err) => {
                    if (err) message.send("❌ | Failed to kick. Please ensure I have admin permissions.");
                });
            }
        });
    },

    onEvent: async function ({ event, api, threadsData }) {
        if (event.logMessageType === "log:subscribe") {
            const { threadID, logMessageData } = event;
            const dataBanned = await threadsData.get(threadID, 'data.banned_ban', []);
            if (dataBanned.length === 0) return;

            // বটের অ্যাডমিন স্ট্যাটাস চেক
            const threadInfo = await api.getThreadInfo(threadID);
            const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == api.getCurrentUserID());

            for (const user of logMessageData.addedParticipants) {
                const bannedUser = dataBanned.find(item => item.id == user.userFbId);
                if (bannedUser) {
                    if (isBotAdmin) {
                        api.removeUserFromGroup(user.userFbId, threadID, (err) => {
                            if (!err) api.sendMessage(`⚠ | ${user.fullName} was previously banned!\nReason: ${bannedUser.reason}\nAction: Auto-kicked.`, threadID);
                        });
                    } else {
                        api.sendMessage(`⚠ | Banned user ${user.fullName} joined, but I lack admin power to kick them.`, threadID);
                    }
                }
            }
        }
    }
};
            
