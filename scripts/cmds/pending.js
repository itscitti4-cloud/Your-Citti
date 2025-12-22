const axios = require('axios');

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "pending", "p"],
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 2, // শুধুমাত্র অ্যাডমিনদের জন্য
    shortDescription: "Group pending management",
    longDescription: "show pending list, use for approve or remove",
    category: "admin",
    guide: {
      en: "!pending/pen/p for show all pending request।"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]);
      const pending = await api.getThreadList(100, null, ["PENDING"]);
      const list = [...spam, ...pending];

      if (list.length === 0) {
        return api.sendMessage("Ma'am, There are no pending requests❎", threadID, messageID);
      }

      let msg = "Pending Groups list:\n\n";
      list.forEach((item, index) => {
        msg += `${index + 1}. Name: ${item.name}\nID: ${item.threadID}\n\n`;
      });

      msg += "✓ Reply with group number/all to approve! × Reply with number/all with r to remove. × Reply with "c" to Cancel.";

      return api.sendMessage(msg, threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          pendingList: list
        });
      }, messageID);

    } catch (e) {
      return api.sendMessage("Sorry Ma'am, something went wrong", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { threadID, messageID, body, senderID } = event;
    const { pendingList, author } = Reply;

    if (senderID !== author) return;

    const input = body.toLowerCase().trim();

    // ক্যাসেল অপারেশন (c)
    if (input === 'c') {
      api.unsendMessage(Reply.messageID);
      return api.sendMessage("Operation Cancel Successfully.", threadID);
    }

    // সব অ্যাপ্রুভ (all)
    if (input === 'all') {
      for (const item of pendingList) {
        await api.sendMessage("${item.name} Group approve successfully by Lubna Jannat!", item.threadID);
      }
      return api.sendMessage(`মোট ${pendingList.length} Group approve successfully`, threadID);
    }

    // সব রিমুভ (all r)
    if (input === 'all r') {
      for (const item of pendingList) {
        await api.deleteThread(item.threadID);
      }
      return api.sendMessage(`মোট ${pendingList.length} Remove successfully`, threadID);
    }

    // সিঙ্গেল রিমুভ (নাম্বার r)
    if (input.endsWith(' r')) {
      const index = parseInt(input.split(' ')[0]) - 1;
      if (pendingList[index]) {
        await api.deleteThread(pendingList[index].threadID);
        return api.sendMessage(`গ্রুপ '${pendingList[index].name}' Remove successfully`, threadID);
      }
    }

    // সিঙ্গেল অ্যাপ্রুভ (শুধু নাম্বার)
    const index = parseInt(input) - 1;
    if (!isNaN(index) && pendingList[index]) {
      await api.sendMessage("${item.name} Group approve successfully by Lubna Jannat!!", pendingList[index].threadID);
      return api.sendMessage(`Group '${pendingList[index].name}' Approve Successfully`, threadID);
    }

    return api.sendMessage("Wrong format! Ma'am please try again", threadID, messageID);
  }
};
