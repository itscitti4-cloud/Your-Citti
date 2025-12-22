const axios = require('axios');

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "p"],
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 2, 
    shortDescription: "Group pending management",
    longDescription: "Show pending list, use for approve or remove",
    category: "admin",
    guide: {
      en: "{pn} or {pn} pen to show all pending requests."
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]);
      const pending = await api.getThreadList(100, null, ["PENDING"]);
      const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

      if (list.length === 0) {
        return api.sendMessage("Ma'am, There are no pending requests ❎", threadID, messageID);
      }

      let msg = "👑 𝐏𝐄𝐍𝐃𝐈𝐍𝐆 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓 👑\n━━━━━━━━━━━━━━━━━━\n";
      list.forEach((item, index) => {
        msg += `${index + 1}. 📂 Name: ${item.name}\n🆔 ID: ${item.threadID}\n━━━━━━━━━━━━━━━━━━\n`;
      });

      msg += "✓ Reply with [number/all] to Approve!\n× Reply with [number r/all r] to Remove.\n× Reply with [c] to Cancel.";

      return api.sendMessage(msg, threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          pendingList: list
        });
      }, messageID);

    } catch (e) {
      return api.sendMessage("Sorry Ma'am, something went wrong while fetching list.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, body, senderID } = event;
    const { pendingList, author } = Reply;

    if (senderID !== author) return;

    const input = body.toLowerCase().trim();

    // ১. ক্যানসেল অপারেশন (c)
    if (input === 'c') {
      api.unsendMessage(Reply.messageID);
      return api.sendMessage("✅ Operation Cancelled Successfully.", threadID);
    }

    // ২. সব অ্যাপ্রুভ (all)
    if (input === 'all') {
      api.sendMessage("⏳ Approving all groups...", threadID);
      for (const item of pendingList) {
        await api.sendMessage(`Congratulations! Your group has been approved by AkHi Ma'am.`, item.threadID);
      }
      return api.sendMessage(`✅ মোট ${pendingList.length}টি গ্রুপ সফলভাবে অ্যাপ্রুভ করা হয়েছে।`, threadID);
    }

    // ৩. সব রিমুভ (all r)
    if (input === 'all r') {
      api.sendMessage("⏳ Removing all requests...", threadID);
      for (const item of pendingList) {
        await api.deleteThread(item.threadID);
      }
      return api.sendMessage(`✅ মোট ${pendingList.length}টি রিকোয়েস্ট রিমুভ করা হয়েছে।`, threadID);
    }

    // ৪. সিঙ্গেল রিমুভ (নাম্বার r)
    if (input.endsWith(' r')) {
      const index = parseInt(input.split(' ')[0]) - 1;
      if (!isNaN(index) && pendingList[index]) {
        const groupName = pendingList[index].name;
        await api.deleteThread(pendingList[index].threadID);
        return api.sendMessage(`✅ Group '${groupName}' has been removed.`, threadID);
      }
    }

    // ৫. সিঙ্গেল অ্যাপ্রুভ (শুধু নাম্বার)
    const index = parseInt(input) - 1;
    if (!isNaN(index) && pendingList[index]) {
      const group = pendingList[index];
      await api.sendMessage(`Congratulations! "${group.name}" group is approved by AkHi Ma'am!`, group.threadID);
      return api.sendMessage(`✅ Group '${group.name}' approved successfully!`, threadID);
    }

    return api.sendMessage("⚠️ Wrong format! Ma'am, please try again with correct number or command.", threadID, messageID);
  }
};
