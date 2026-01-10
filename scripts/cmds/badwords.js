module.exports = {
  config: {
    name: "badwords",
    aliases: ["badword"],
    version: "1.5",
    author: "AkHi",
    countDown: 5,
    role: 1,
    description: "Automatically warn or kick users for using forbidden words.",
    category: "box chat",
    guide: 
		"   {pn} add <words>: add banned words (multiple words separated by \",\" or \"|\")" +
        "\n   {pn} delete <words>: delete banned words" +
        "\n   {pn} list <hide | leave blank>: show banned words list" +
        "\n   {pn} unwarn [<userID> | <@tag>]: remove 1 warning of 1 member" +
        "\n   {pn} on: turn on protection" +
        "\n   {pn} off: turn off protection"
  },

  onStart: async function ({ message, event, args, threadsData, usersData, role }) {
    if (!await threadsData.get(event.threadID, "data.badWords"))
      await threadsData.set(event.threadID, {
        words: [],
        violationUsers: {}
      }, "data.badWords");

    const badWords = await threadsData.get(event.threadID, "data.badWords.words", []);

    switch (args[0]) {
      case "add": {
        if (role < 1) return message.reply("⚠ | Only admins can add banned words to the list");
        const words = args.slice(1).join(" ").split(/[,|]/);
        if (words.length === 0 || !args[1]) return message.reply("⚠ | You haven't entered the banned words");
        const success = [];
        for (const word of words) {
          const cleanWord = word.trim().toLowerCase();
          if (cleanWord.length >= 2 && !badWords.includes(cleanWord)) {
            badWords.push(cleanWord);
            success.push(cleanWord);
          }
        }
        await threadsData.set(event.threadID, badWords, "data.badWords.words");
        return message.reply(`✓ | Added ${success.length} banned words to the list.`);
      }
      case "delete":
      case "del": {
        if (role < 1) return message.reply("⚠ | Only admins can delete banned words from the list");
        const words = args.slice(1).join(" ").split(/[,|]/);
        if (words.length === 0 || !args[1]) return message.reply("⚠ | You haven't entered the words to delete");
        let count = 0;
        for (const word of words) {
          const cleanWord = word.trim().toLowerCase();
          const index = badWords.indexOf(cleanWord);
          if (index > -1) {
            badWords.splice(index, 1);
            count++;
          }
        }
        await threadsData.set(event.threadID, badWords, "data.badWords.words");
        return message.reply(`✓ | Deleted ${count} banned words from the list.`);
      }
      case "list": {
        if (badWords.length === 0) return message.reply("⚠ | The list of banned words in your group is currently empty");
        return message.reply(`≡ | Banned words list: ${args[1] === "hide" ? badWords.map(word => hideWord(word)).join(", ") : badWords.join(", ")}`);
      }
      case "on": {
        if (role < 1) return message.reply("⚠ | Only admins can turn on this feature");
        await threadsData.set(event.threadID, true, "settings.badWords");
        return message.reply("✓ | Banned words warning has been turned ON");
      }
      case "off": {
        if (role < 1) return message.reply("⚠ | Only admins can turn off this feature");
        await threadsData.set(event.threadID, false, "settings.badWords");
        return message.reply("✓ | Banned words warning has been turned OFF");
      }
      case "unwarn": {
        if (role < 1) return message.reply("⚠ | Only admins can delete banned words warning");
        let userID = Object.keys(event.mentions)[0] || args[1] || (event.messageReply ? event.messageReply.senderID : null);
        if (!userID || isNaN(userID)) return message.reply("⚠ | Please provide a valid User ID or tag someone.");
        const violationUsers = await threadsData.get(event.threadID, "data.badWords.violationUsers", {});
        if (!violationUsers[userID] || violationUsers[userID] === 0) return message.reply("⚠ | This user has no warnings.");
        violationUsers[userID]--;
        await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
        const userName = await usersData.getName(userID);
        return message.reply(`✓ | Removed 1 warning for ${userName} (${userID}).`);
      }
      default:
        return message.reply("Usage: !badwords <add | delete | list | on | off | unwarn>");
    }
  },

  onChat: async function ({ message, event, api, threadsData, prefix }) {
    if (!event.body) return;
    const threadData = global.db.allThreadData.find(t => t.threadID === event.threadID) || await threadsData.create(event.threadID);
    if (!threadData.settings.badWords) return;

    const badWordList = threadData.data.badWords?.words || [];
    if (badWordList.length === 0) return;

    const body = event.body.toLowerCase();
    for (const word of badWordList) {
      if (body.match(new RegExp(`\\b${word}\\b`, "gi"))) {
        const violationUsers = threadData.data.badWords?.violationUsers || {};
        
        // সরাসরি ফেসবুক থেকে অ্যাডমিন ডাটা চেক
        const threadInfo = await api.getThreadInfo(event.threadID);
        const adminIDs = threadInfo.adminIDs.map(a => a.id);
        const botID = api.getCurrentUserID();

        // ইউজার অ্যাডমিন হলে তাকে ওয়ার্নিং বা কিক করবে না
        if (adminIDs.includes(event.senderID)) return;

        if ((violationUsers[event.senderID] || 0) < 1) {
          violationUsers[event.senderID] = 1;
          await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
          return message.reply(`⚠ | Banned word "${word}" detected. This is your first warning. Next time you will be kicked.`);
        } else {
          // দ্বিতীয়বার ভায়োলেশন হলে কিক করার চেষ্টা
          if (!adminIDs.includes(botID)) {
            return message.reply(`⚠ | Banned word detected again, but I cannot kick you because I am not an admin.`);
          }
          
          await message.reply(`⚠ | Banned word detected again. You have violated twice and will be removed from the group.`);
          api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
            if (err) console.error("Kick Error:", err);
          });
          
          // ভায়োলেশন রিসেট (ঐচ্ছিক, কিক হয়ে গেলে ডাটা পরিষ্কার রাখা ভালো)
          violationUsers[event.senderID] = 0;
          await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
          return;
        }
      }
    }
  }
};

function hideWord(str) {
  return str.length <= 2 ? str[0] + "*" : str[0] + "*".repeat(str.length - 2) + str[str.length - 1];
	  }
								  
