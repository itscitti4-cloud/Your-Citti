module.exports = {
  config: {
    name: "autoban",
    version: "1.0.1",
    author: "AkHi",
    countDown: 5,
    role: 1, // Admins only
    shortDescription: "Automatically ban users for using forbidden words.",
    longDescription: "When enabled, the bot will automatically ban any member who uses words from the forbidden list if the bot is admin.",
    category: "admin",
    guide: "{pn} add <word> | remove <word> | list | on | off"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    if (!global.autoban) global.autoban = new Map();

    const config = global.autoban.get(threadID) || { status: false, words: [] };
    const action = args[0]?.toLowerCase();

    switch (action) {
      case "on":
        config.status = true;
        global.autoban.set(threadID, config);
        return message.reply("Auto-ban protection has been enabled for this group.");

      case "off":
        config.status = false;
        global.autoban.set(threadID, config);
        return message.reply("Auto-ban protection has been disabled.");

      case "add":
        const wordToAdd = args.slice(1).join(" ").toLowerCase();
        if (!wordToAdd) return message.reply("Please provide a word to add to the forbidden list.");
        if (config.words.includes(wordToAdd)) return message.reply("This word is already in the list.");
        config.words.push(wordToAdd);
        global.autoban.set(threadID, config);
        return message.reply(`Added "${wordToAdd}" to the forbidden words list.`);

      case "remove":
        const wordToRemove = args.slice(1).join(" ").toLowerCase();
        const index = config.words.indexOf(wordToRemove);
        if (index === -1) return message.reply("Word not found in the list.");
        config.words.splice(index, 1);
        global.autoban.set(threadID, config);
        return message.reply(`Removed "${wordToRemove}" from the forbidden list.`);

      case "list":
        if (config.words.length === 0) return message.reply("The forbidden words list is empty.");
        return message.reply(`🚫 Forbidden Words:\n${config.words.join(", ")}`);

      default:
        return message.reply("Usage: {pn} <on | off | add | remove | list>");
    }
  },

  onChat: async function ({ api, event, message }) {
    const { threadID, senderID, body } = event;
    if (!global.autoban) return;

    const config = global.autoban.get(threadID);
    if (!config || !config.status || !body) return;

    const lowerBody = body.toLowerCase();
    const isForbidden = config.words.some(word => lowerBody.includes(word));

    if (isForbidden) {
      try {
        // সরাসরি ফেসবুক থেকে রিয়েল-টাইম ডাটা নেওয়া
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
        const botID = api.getCurrentUserID();

        // ইউজার অ্যাডমিন কি না চেক করা (অ্যাডমিনদের ব্যান করবে না)
        if (adminIDs.includes(senderID)) return;

        // বট নিজে অ্যাডমিন কি না চেক করা
        if (!adminIDs.includes(botID)) {
          return message.reply("Security Alert: Forbidden word detected, but I cannot ban the user because I am not an admin in this group.");
        }

        await api.removeUserFromGroup(senderID, threadID);
        return message.reply(`Security Alert! User has been banned for using forbidden language.`);
      } catch (e) {
        console.error("Auto-ban failed:", e);
      }
    }
  }
};
