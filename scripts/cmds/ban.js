const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "ban",
        version: "1.7",
        author: "AkHi",
        countDown: 5,
        role: 1,
        description: "Ban user from box chat",
        category: "box chat",
        guide:
                  "     {pn} [@tag|uid|fb link|reply] [<reason>]: Ban user from box chat"
                + "\n   {pn} check: Check and kick banned members"
                + "\n   {pn} unban [@tag|uid|fb link|reply]: Unban user"
                + "\n   {pn} list: View banned members list"
    },

    onStart: async function ({ message, event, args, threadsData, usersData, api }) {
        const { members, adminIDs } = await threadsData.get(event.threadID);
        const { senderID, threadID, mentions, messageReply } = event;
        let target;
        let reason = "";

        const dataBanned = await threadsData.get(threadID, 'data.banned_ban', []);

        // --- UNBAN LOGIC ---
        if (args[0] == 'unban') {
            let unbanTarget;
            if (messageReply) unbanTarget = messageReply.senderID;
            else if (Object.keys(mentions).length > 0) unbanTarget = Object.keys(mentions)[0];
            else if (args[1]?.startsWith('https')) unbanTarget = await findUid(args[1]);
            else if (!isNaN(args[1])) unbanTarget = args[1];

            if (!unbanTarget) return message.reply("⚠ | Please tag, reply, or provide a link/UID to unban.");

            const index = dataBanned.findIndex(item => item.id == unbanTarget);
            if (index == -1) return message.reply(`⚠ | User with ID ${unbanTarget} is not banned.`);

            dataBanned.splice(index, 1);
            await threadsData.set(threadID, dataBanned, 'data.banned_ban');
            const name = await usersData.getName(unbanTarget) || "Facebook User";
            return message.reply(`✓ | Unbanned ${name} from box chat!`);
        }

        // --- CHECK & LIST LOGIC (আগের মতোই ঠিক আছে) ---
        if (args[0] == "check") { /* ... */ }
        if (args[0] == 'list') { /* ... */ }

        // --- IMPROVED BAN TARGETING (মেনশন ডিটেকশন ফিক্স) ---
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

        // --- ERROR HANDLING ---
        if (!target) {
            return message.reply("⚠ | বট মেনশন চিনতে পারছে না। দয়া করে সাধারণ ফন্ট ব্যবহার করে ট্যাগ করুন অথবা ইউজারকে 'Reply' দিয়ে !ban লিখুন।");
        }

        if (target == senderID) return message.reply("⚠ | You can't ban yourself!");
        if (adminIDs.includes(target)) return message.reply("✗ | You can't ban an administrator!");
        if (dataBanned.some(item => item.id == target)) return message.reply("✗ | This person is already banned!");

        const name = await usersData.getName(target) || "Facebook User";
        const time = moment().tz("Asia/Dhaka").format('HH:mm:ss DD/MM/YYYY');
        
        const newBan = { id: target, time, reason: reason || "No reason" };
        dataBanned.push(newBan);
        
        await threadsData.set(threadID, dataBanned, 'data.banned_ban');
        
        message.reply(`✓ | Banned ${name} from box chat!`, () => {
            api.removeUserFromGroup(target, threadID, (err) => {
                if (err) message.send("⚠ | Bot needs admin power to kick.");
            });
        });
    },

    onEvent: async function ({ event, api, threadsData }) {
        if (event.logMessageType === "log:subscribe") {
            const { threadID, logMessageData } = event;
            const dataBanned = await threadsData.get(threadID, 'data.banned_ban', []);
            if (dataBanned.length === 0) return;

            for (const user of logMessageData.addedParticipants) {
                const bannedUser = dataBanned.find(item => item.id == user.userFbId);
                if (bannedUser) {
                    api.removeUserFromGroup(user.userFbId, threadID, (err) => {
                        if (!err) api.sendMessage(`⚠ | ${user.fullName} was previously banned and auto-kicked.`, threadID);
                    });
                }
            }
        }
    }
};
