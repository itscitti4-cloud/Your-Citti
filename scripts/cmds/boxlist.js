const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "boxlist",
    version: "3.0",
    author: "AkHi",
    countDown: 5,
    role: 2,
    description: "Group list and management (Only active groups)",
    category: "admin",
    guide: {
      en: "{pn} work with reply"
    }
  },

  onStart: async function ({ api, event }) {
    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    const activeGroups = threadList.filter(thread => thread.isGroup && thread.isSubscribed);

    let msg = "👑 𝐀𝐂𝐓𝐈𝐕𝐄 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓 👑\n━━━━━━━━━━━━━━━━━━\n";
    let list = [];
    let num = 1;

    if (activeGroups.length === 0) {
      return api.sendMessage("❌ বর্তমানে কোনো একটিভ গ্রুপ খুঁজে পাওয়া যায়নি।", event.threadID);
    }

    for (const thread of activeGroups) {
      list.push({
        threadID: thread.threadID,
        threadName: thread.name || "Unnamed Group"
      });
      msg += `|${num++}| 📂 ${thread.name || "Unnamed Group"}\n🆔 ${thread.threadID}\n━━━━━━━━━━━━━━━━━━\n`;
    }

    msg += "💡 [number/all + L] -> Simple Leave\n💡 [number/all + L + noti + text] -> Message then Leave\n💡 [number/all + text] -> Simple Notify";

    return api.sendMessage(msg, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        list
      });
    }, event.messageID);
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, list } = Reply;
    if (event.senderID != author) return;

    const input = event.body.trim();
    const args = input.split(/\s+/);
    const action = args[0].toLowerCase();
    
    // সময় এবং নাম সংগ্রহের লজিক
    const time = moment.tz("Asia/Dhaka").format("hh:mm A");
    const userInfo = await api.getUserInfo(event.senderID);
    const senderName = userInfo[event.senderID].name;

    const premiumStyle = (text) => `»—💝— **𝙽𝙾𝚃𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽** —💝—«

 ➤ 𝐓𝐢𝐦𝐞: ${time}
 ➤ 𝐀𝐝𝐦𝐢𝐧: ${senderName}

»———————— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ————————«

${text}

»────────────────────«
🌸         Thank You Everyone        🌸`;

    const handleLeave = async (threadID, threadName, msgContent) => {
      try {
        if (msgContent) {
          await api.sendMessage(premiumStyle(msgContent), threadID);
        }
        await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
        return true;
      } catch (e) {
        return false;
      }
    };

    // ১. সব গ্রুপ থেকে লিভ
    if (action === "all" && args[1]?.toLowerCase() === "l") {
      let messageToSend = null;
      if (args[2]?.toLowerCase() === "noti") messageToSend = args.slice(3).join(" ");
      
      api.sendMessage("⏳ Processing leave from all groups...", event.threadID);
      for (const group of list) {
        await handleLeave(group.threadID, group.threadName, messageToSend);
      }
      return api.sendMessage("✅ Successfully left all groups.", event.threadID);
    }

    // ২. সব গ্রুপে নোটিফিকেশন
    if (action === "all") {
      const messageContent = args.slice(1).join(" ");
      api.sendMessage("⏳ Sending notification to all groups...", event.threadID);
      for (const group of list) {
        try { await api.sendMessage(premiumStyle(messageContent), group.threadID); } catch (e) {}
      }
      return api.sendMessage("✅ Notification sent to all groups.", event.threadID);
    }

    // ৩. নির্দিষ্ট গ্রুপ থেকে লিভ
    if (!isNaN(action) && args[1]?.toLowerCase() === "l") {
      const index = parseInt(action) - 1;
      const group = list[index];
      if (group) {
        let messageToSend = null;
        if (args[2]?.toLowerCase() === "noti") messageToSend = args.slice(3).join(" ");
        await handleLeave(group.threadID, group.threadName, messageToSend);
        return api.sendMessage(`✅ Left from "${group.threadName}".`, event.threadID);
      }
    }

    // ৪. নির্দিষ্ট গ্রুপে নোটিফিকেশন
    if (!isNaN(action)) {
      const index = parseInt(action) - 1;
      const group = list[index];
      if (group) {
        const messageContent = args.slice(1).join(" ");
        if (!messageContent) return api.sendMessage("⚠️ Please provide a message content.", event.threadID);
        try {
          await api.sendMessage(premiumStyle(messageContent), group.threadID);
          return api.sendMessage(`✅ Sent to: ${group.threadName}`, event.threadID);
        } catch (e) {
          return api.sendMessage(`❌ Failed to send to ${group.threadName}.`, event.threadID);
        }
      }
    }

    return api.sendMessage("⚠️ Wrong format!", event.threadID);
  }
};
        
