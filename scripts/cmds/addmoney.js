const axios = require('axios');

module.exports = {
  config: {
    name: "addmoney",
    aliases: ["addm", "setmoney"],
    version: "1.0.5",
    role: 2, // Role 2 ensures only Admins/Moderators can use this
    author: "AkHi",
    description: "Add balance to a user's account",
    category: "admin",
    usages: "[reply/mention/id] [amount]",
    cooldowns: 2
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    let targetID, amount;

    // ১. ডাটা নির্ধারণ (রিপ্লাই, মেনশন বা আইডি থেকে)
    if (messageReply) {
      targetID = messageReply.senderID;
      amount = parseInt(args[0]);
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      amount = parseInt(args.join(" ").replace(mentions[targetID], "").trim());
    } else {
      targetID = args[0];
      amount = parseInt(args[1]);
    }

    // ২. ইনপুট ভ্যালিডেশন
    if (!targetID || isNaN(amount)) {
      return api.sendMessage(
        "━━━━━━━━━━━━━━━\n" +
        "⚠️ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗙𝗢𝗥𝗠𝗔𝗧\n" +
        "━━━━━━━━━━━━━━━\n" +
        "Please use the correct format:\n" +
        "» Reply to a message: !addm [amount]\n" +
        "» Mention someone: !addm @name [amount]\n" +
        "» Use UID: !addm [UID] [amount]\n" +
        "━━━━━━━━━━━━━━━", 
        threadID, messageID
      );
    }

    try {
      // ৩. ডাটাবেজে টাকা যোগ করা
      const userData = await usersData.get(targetID);
      if (!userData) {
        return api.sendMessage("❌ | User not found in database.", threadID, messageID);
      }

      const currentBalance = await usersData.getMoney(targetID);
      const newBalance = currentBalance + amount;

      await usersData.set(targetID, { money: newBalance });

      // ৪. সাকসেস মেসেজ (সুন্দর ও গোছানো ইংরেজি রিপ্লাই)
      const name = userData.name || "User";
      
      return api.sendMessage(
        "━━━━━━━━━━━━━━━\n" +
        "💳 𝗕𝗔𝗟𝗔𝗡𝗖𝗘 𝗨𝗣𝗗𝗔𝗧𝗘𝗗\n" +
        "━━━━━━━━━━━━━━━\n" +
        `👤 𝗨𝘀𝗲𝗿: ${name}\n` +
        `🆔 𝗜𝗗: ${targetID}\n` +
        `💰 𝗔𝗱𝗱𝗲𝗱: +$${amount.toLocaleString()}\n` +
        `🏦 𝗡𝗲𝘄 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: $${newBalance.toLocaleString()}\n` +
        "━━━━━━━━━━━━━━━\n" +
        "✅ Transaction Successful! ✨",
        threadID, messageID
      );

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ | An error occurred while updating the database.", threadID, messageID);
    }
  }
};
                             
