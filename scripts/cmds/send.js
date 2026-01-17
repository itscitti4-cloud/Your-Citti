const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "send",
        aliases: ["pay", "transfer"],
        version: "2.6.0",
        author: "NAWAB",
        countDown: 5,
        role: 0,
        shortDescription: "Transfer balance to another user",
        longDescription: "Send money using Reply, Mention, or UID supporting K, M, B, T units.",
        category: "game",
        guide: "{pn} [amount] (reply/mention) or {pn} [UID] [amount]"
    },

    onStart: async function ({ api, event, args, message, usersData }) {
        const { threadID, messageID, senderID, type, mentions } = event;

        let targetID;
        let rawAmount;

        // সংক্ষেপিত সংখ্যাকে (1K, 1M) পূর্ণ সংখ্যায় রূপান্তর করার ফাংশন
        const parseAmount = (input) => {
            if (typeof input !== 'string') return NaN;
            const units = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 };
            const match = input.toLowerCase().match(/^(\d+(\.\d+)?)([kmbteq])?$/);
            if (!match) return parseFloat(input);
            const value = parseFloat(match[1]);
            const unit = match[3];
            return unit ? value * units[unit] : value;
        };

        // বড় সংখ্যাকে সংক্ষেপে দেখানোর ফাংশন
        const formatMoney = (n) => {
            const num = Math.abs(n);
            if (num >= 1e15) return (n / 1e15).toFixed(1).replace(/\.0$/, '') + 'Q';
            if (num >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
            if (num >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
            if (num >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
            if (num >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
            return n.toLocaleString();
        };

        const getTime = () => {
            const now = moment.tz("Asia/Dhaka");
            const date = now.format("DD/MM/YYYY");
            const time = now.format("hh:mm A");
            return { date, time };
        };

        // ইনপুট লজিক
        if (type == "message_reply") {
            targetID = event.messageReply.senderID;
            rawAmount = args[0];
        } 
        else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            // মেনশন বাদ দিয়ে প্রথম যে অংশে সংখ্যা বা ইউনিট আছে সেটি খুঁজে বের করা
            rawAmount = args.find(a => !isNaN(parseFloat(a)) && !a.includes('@'));
        } 
        else if (args.length >= 2) {
            targetID = args[0];
            rawAmount = args[1];
        } 
        else {
            return message.reply("❌ | 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐒𝐲𝐧𝐭𝐚𝐱!\n𝐔𝐬𝐞: !send [amount] @mention");
        }

        const amount = Math.floor(parseAmount(rawAmount));

        if (!amount || isNaN(amount) || amount <= 0) 
            return message.reply("💸 | 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐚𝐦𝐨𝐮𝐧𝐭 (e.g., 100, 1K, 1.5M)!");

        if (targetID == senderID) 
            return message.reply("🤦‍♂️ | 𝐘𝐨𝐮 𝐜𝐚𝐧𝐧𝐨𝐭 𝐬𝐞𝐧𝐝 𝐦𝐨𝐧𝐞𝐲 𝐭𝐨 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟!");

        try {
            const senderData = await usersData.get(senderID);
            const targetData = await usersData.get(targetID);

            if (!targetData) return message.reply("👤 | 𝐔𝐬𝐞ר 𝐧𝐨𝐭 𝐟𝐨𝐮𝐧𝐝 𝐢𝐧 𝐝𝐚𝐭𝐚𝐛𝐚𝐬𝐞!");

            const currentMoney = senderData.money || 0;

            if (amount > currentMoney) 
                return message.reply(`🚫 | 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐁𝐚𝐥𝐚𝐧𝐜𝐞! 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐨𝐧𝐥𝐲 $${formatMoney(currentMoney)}`);

            await usersData.set(senderID, { money: currentMoney - amount });
            await usersData.set(targetID, { money: (targetData.money || 0) + amount });

            const { date, time } = getTime();

            const receipt =`✅ 𝐓𝐫𝐚𝐧𝐬𝐚𝐜𝐭𝐢𝐨𝐧 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥
━━━━━━━━━━━━━━━━━━
📅 𝐃𝐚𝐭𝐞: ${date}
⏰ 𝐓𝐢𝐦𝐞: ${time}
━━━━━━━━━━━━━━━━━━
👤 𝐅𝐫𝐨𝐦: ${senderData.name}
👤 𝐓𝐨: ${targetData.name}
🆔 𝐈𝐃: ${targetID}
💰 𝐀𝐦𝐨𝐮𝐧𝐭: $${formatMoney(amount)}
🎊 𝐒𝐭𝐚𝐭𝐮𝐬: SUCCESSFUL
━━━━━━━━━━━━━━━━━━
✨ 𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐟𝐨𝐫 𝐮𝐬𝐢𝐧𝐠 𝐨𝐮𝐫 𝐬𝐞𝐫𝐯𝐢𝐜𝐞!`;

            return message.reply(receipt);

        } catch (error) {
            console.error(error);
            return message.reply("⚠️ | 𝐀𝐧 error 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝! 𝐌𝐚𝐤𝐞 𝐬𝐮𝐫𝐞 𝐭𝐡𝐞 𝐮𝐬𝐞𝐫 𝐞𝐱𝐢𝐬𝐭𝐬.");
        }
    }
};
