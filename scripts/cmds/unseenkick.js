const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "unseenkick",
    aliases: ["uns", "unk"],
    version: "1.4",
    author: "AkHi",
    countDown: 5,
    role: 0, 
    shortDescription: "List and kick inactive members",
    longDescription: "View members who haven't seen messages and kick them based on inactivity days.",
    category: "admin",
    guide: "{pn} or {pn} <days>"
  },

  onStart: async function ({ api, event, args, message, usersData, threadsData, role }) {
    const { threadID, messageID, senderID } = event;
    const threadInfo = await threadsData.get(threadID);
    
    const isGroupAdmin = threadInfo.adminIDs.includes(senderID);
    const isBotAdmin = role >= 2;

    if (!isGroupAdmin && !isBotAdmin) {
      return message.reply("❌ | You must be a Group Admin or Bot Admin to use this command.");
    }

    const now = Date.now();
    const inactiveMembers = [];
    
    const processingMsg = await message.reply("⏳ | Analyzing group activity, please wait...");

    for (const memberID of threadInfo.members) {
      if (memberID == api.getCurrentUserID()) continue;

      try {
        const userData = await usersData.get(memberID.toString());
        
        // যদি ডাটাবেজে lastSeen না থাকে বা একেবারে নতুন হয়
        const lastSeen = (userData && userData.lastSeen) ? userData.lastSeen : 0;
        const lastMsg = (userData && userData.lastMessage) ? userData.lastMessage : "No record found";
        
        const diff = now - lastSeen;
        const days = lastSeen === 0 ? 999 : Math.floor(diff / (1000 * 60 * 60 * 24));

        // লজিক: যারা গত ১০ মিনিটের মধ্যে কোনো মেসেজ দেয়নি তাদের ইনঅ্যাক্টিভ ধরবে (টেস্টিং এর জন্য)
        if (diff > 600000 || lastSeen === 0) {
          inactiveMembers.push({
            id: memberID,
            name: (userData && userData.name) ? userData.name : "Facebook User",
            lastSeen: lastSeen,
            days: days,
            lastMsg: lastMsg
          });
        }
      } catch (e) {
        console.error("Error fetching data for " + memberID, e);
      }
    }

    // !unk <days> অটো কিক লজিক
    if (event.body.startsWith("!unk") && args[0]) {
      const dayLimit = parseInt(args[0]);
      if (isNaN(dayLimit)) return message.reply("❌ | Please enter a valid number of days.");

      const toKick = inactiveMembers.filter(m => m.days >= dayLimit);
      if (toKick.length === 0) return message.reply(`✅ | No members found inactive for ${dayLimit} days.`);

      let kickCount = 0;
      for (const user of toKick) {
        if (threadInfo.adminIDs.includes(user.id)) continue;
        try {
          await api.removeUserFromGroup(user.id, threadID);
          kickCount++;
        } catch (e) {}
      }
      return message.reply(`🧹 | Kicked ${kickCount} members who were inactive for ${dayLimit}+ days.`);
    }

    // লিস্ট দেখানোর লজিক
    inactiveMembers.sort((a, b) => a.lastSeen - b.lastSeen);

    if (inactiveMembers.length === 0) {
      return message.reply("✅ | Everyone in this group is currently active!");
    }

    let msg = "📊 [ INACTIVE MEMBERS LIST ] 📊\n━━━━━━━━━━━━━━━━━━\n";
    const displayList = inactiveMembers.slice(0, 20);

    displayList.forEach((user, index) => {
      const timeStr = user.lastSeen === 0 ? "Never Seen" : moment(user.lastSeen).tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm A");
      msg += `${index + 1}. ${user.name}\n🕒 Last Active: ${timeStr}\n💬 Msg: ${user.lastMsg}\n━━━━━━━━━━━━━━━━━━\n`;
    });

    msg += "\n💡 Reply with '<number> kick' to remove a member.";
    
    api.unsendMessage(processingMsg.messageID); // Processing মেসেজটি মুছে ফেলা
    return message.reply(msg, (err, info) => {
      if (err) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: senderID,
        inactiveMembers: displayList
      });
    });
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { body, senderID, threadID } = event;
    if (senderID !== Reply.author) return;

    if (body.toLowerCase().includes("kick")) {
      const num = parseInt(body.split(" ")[0]);
      const target = Reply.inactiveMembers[num - 1];

      if (!target) return message.reply("❌ | Invalid number from the list.");

      try {
        await api.removeUserFromGroup(target.id, threadID);
        return message.reply(`✅ | Kicked ${target.name} from the group.`);
      } catch (e) {
        return message.reply("❌ | Failed to kick. Bot might not be an admin.");
      }
    }
  }
};

