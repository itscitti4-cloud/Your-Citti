module.exports = {
    config: {
        name: "send",
        aliases: ["pay", "t", "transfer"],
        version: "2.0.0",
        author: "AkHi",
        countDown: 5,
        role: 0,
        shortDescription: "Transfer balance to another user",
        longDescription: "Send money using Reply, Mention, or UID.",
        category: "Game",
        guide: "{pn} [amount] (reply/mention) or {pn} [UID] [amount]"
    },

    onStart: async function ({ api, event, args, message, Users }) {
        const { threadID, messageID, senderID, type, mentions } = event;

        let targetID;
        let amount;

        // 1. Handle Reply
        if (type == "message_reply") {
            targetID = event.messageReply.senderID;
            amount = parseInt(args[0]);
        } 
        // 2. Handle Mention
        else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            amount = parseInt(args[args.length - 1]);
        } 
        // 3. Handle UID
        else if (args.length >= 2 && !isNaN(args[0])) {
            targetID = args[0];
            amount = parseInt(args[1]);
        } 
        else {
            return message.reply("❌ | Invalid syntax!\nUse: !t send [amount] (reply/mention) or !t send [UID] [amount]");
        }

        // Validations
        if (isNaN(amount) || amount <= 0) 
            return message.reply("💸 | Please enter a valid positive amount!");

        if (targetID == senderID) 
            return message.reply("🤦‍♂️ | You cannot send money to yourself!");

        try {
            const senderData = await Users.getMoney(senderID);
            const targetName = await Users.getNameUser(targetID);

            if (amount > senderData) 
                return message.reply(`🚫 | Transaction Failed! You need ${amount - senderData}$ more to complete this transfer.`);

            // Execute Transfer
            await Users.decreaseMoney(senderID, amount);
            await Users.increaseMoney(targetID, amount);

            return message.reply({
                body: `✅ 𝗧𝗿𝗮𝗻𝘀𝗮𝗰𝘁𝗶𝗼𝗻 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹\n━━━━━━━━━━━━━━━━━━\n👤 𝗧𝗼: ${targetName}\n🆔 𝗜𝗗: ${targetID}\n💰 𝗔𝗺𝗼𝘂𝗻𝘁: ${amount.toLocaleString()}$\n🎊 𝗦𝘁𝗮𝘁𝘂𝘀: Completed\n━━━━━━━━━━━━━━━━━━\n✨ Thank you for using our service!`
            });

        } catch (error) {
            return message.reply("⚠️ | An error occurred! Make sure the UID is correct and the user exists in my database.");
        }
    }
};
              
