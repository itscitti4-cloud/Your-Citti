module.exports = {
  config: {
    name: "security",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 1, // Only group admins
    shortDescription: "Manage group security settings.",
    longDescription: "Enable or disable Anti-Link, Anti-Spam, and Anti-Tag protection.",
    category: "admin",
    guide: "{pn} <antilink/antispam/antitag> <on/off>"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    if (!global.groupSecurity) global.groupSecurity = new Map();

    const config = global.groupSecurity.get(threadID) || { antilink: false, antispam: false, antitag: false };
    const setting = args[0]?.toLowerCase();
    const status = args[1]?.toLowerCase();

    if (!setting || !status) {
      return message.reply("Usage: !security <antilink/antispam/antitag> <on/off>\nExample: !security antilink on");
    }

    if (status === "on") {
      config[setting] = true;
    } else if (status === "off") {
      config[setting] = false;
    } else {
      return message.reply("Invalid status! Use 'on' or 'off'.");
    }

    global.groupSecurity.set(threadID, config);
    return message.reply(`✅ Security Setting Updated: ${setting} is now ${status.toUpperCase()}.`);
  },

  onChat: async function ({ api, event, message }) {
    const { threadID, senderID, body } = event;
    if (!global.groupSecurity || !global.groupSecurity.has(threadID) || !body) return;

    const config = global.groupSecurity.get(threadID);
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    const isBot = senderID === api.getCurrentUserID();

    if (isAdmin || isBot) return;

    // 1. Anti-Link Protection
    if (config.antilink && (body.includes("http://") || body.includes("https://") || body.includes("www."))) {
      try {
        await api.removeUserFromGroup(senderID, threadID);
        return message.reply("Security Alert: User removed for sharing unauthorized links.");
      } catch (e) { console.error(e); }
    }

    // 2. Anti-Tag All Protection (@everyone / @all)
    if (config.antitag && (body.includes("@everyone") || body.includes("@all"))) {
      try {
        await api.removeUserFromGroup(senderID, threadID);
        return message.reply("Security Alert: User removed for tagging everyone.");
      } catch (e) { console.error(e); }
    }
  }
};
