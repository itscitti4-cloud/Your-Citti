module.exports = {
    config: {
        name: "send",
        aliases: ["pay", "transfer"],
        version: "2.5.0",
        author: "AkHi",
        countDown: 5,
        role: 0,
        shortDescription: "Transfer balance to another user",
        longDescription: "Send money using Reply, Mention, or UID.",
        category: "game",
        guide: "{pn} [amount] (reply/mention) or {pn} [UID] [amount]"
    },

    onStart: async function ({ api, event, args, message, usersData }) {
        const { threadID, messageID, senderID, type, mentions } = event;

        let targetID;
        let amount;

        // ফরম্যাট মানি ফাংশন
        const formatMoney = (n) => {
            const num = Math.abs(n);
            if (num >= 1e15) return (n / 1e15).toFixed(1).replace(/\.0$/, '') + 'Q';
            if (num >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
            if (num >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
            if (num >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
            if (num >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
            return n.toLocaleString();
        };

        // বর্তমান সময় ও তারিখ পাওয়ার ফাংশন
        const getTime = () => {
            const now = new Date();
            const date = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
            const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            return { date, time };
        };

        // ১. রিপ্লাই এর মাধ্যমে পাঠানো
        if (type == "message_reply") {
            targetID = event.messageReply.senderID;
            amount = parseInt(args[0]);
        } 
        // ২. মেনশন এর মাধ্যমে পাঠানো
        else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            amount = parseInt(args.find(a => !isNaN(a)));
        } 
        // ৩. সরাসরি UID এর মাধ্যমে পাঠানো
        else if (args.length >= 2 && !isNaN(args[0])) {
            targetID = args[0];
            amount = parseInt(args[1]);
        } 
        else {
            return message.reply("❌ | 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐒𝐲𝐧𝐭𝐚𝐱!\n𝐔𝐬𝐞: !send [amount] @mention");
        }

        if (!amount || isNaN(amount) || amount <= 0) 
            return message.reply("💸 | 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐚𝐦𝐨𝐮𝐧𝐭!");

        if (targetID == senderID) 
            return message.reply("🤦‍♂️ | 𝐘𝐨𝐮 𝐜𝐚𝐧𝐧𝐨𝐭 𝐬𝐞𝐧𝐝 𝐦𝐨𝐧𝐞𝐲 𝐭𝐨 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟!");

        try {
            const senderData = await usersData.get(senderID);
            const targetData = await usersData.get(targetID);

            if (!targetData) return message.reply("👤 | 𝐔𝐬𝐞𝐫 𝐧𝐨𝐭 𝐟𝐨𝐮𝐧𝐝 𝐢𝐧 𝐝𝐚𝐭𝐚𝐛𝐚𝐬𝐞!");

            const currentMoney = senderData.money || 0;

            if (amount > currentMoney) 
                return message.reply(`🚫 | 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐁𝐚𝐥𝐚𝐧𝐜𝐞! 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐨𝐧𝐥𝐲 $${formatMoney(currentMoney)}`);

            await usersData.set(senderID, { money: currentMoney - amount });
            await usersData.set(targetID, { money: (targetData.money || 0) + amount });

            const { date, time } = getTime();

            // আপনার দেওয়া ATM স্টাইল ফরম্যাট
            const receipt =`✅ 𝐓𝐫𝐚𝐧𝐬𝐚𝐜𝐭𝐢𝐨𝐧 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥
━━━━━━━━━━━━━━━━━━
📅 𝐃𝐚𝐭𝐞: ${date}
⏰ 𝐓𝐢𝐦𝐞: ${time}
━━━━━━━━━━━━━━━━━━
👤 𝐅𝐫𝐨𝐦: ${senderData.name}
👤 𝐓𝐨: ${targetData.name}
🆔 𝐈𝐃: ${targetID}
💰 𝐀𝐦𝐨𝐮𝐧𝐭: ${formatMoney(amount)}
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

