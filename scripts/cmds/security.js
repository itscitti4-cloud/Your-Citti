module.exports = {
  config: {
    name: "security",
    version: "1.0.1",
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

    if (!setting || !status || !config.hasOwnProperty(setting)) {
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
    
    // সরাসরি ফেসবুক থেকে রিয়েল-টাইম ডাটা নেওয়া
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
    
    const isAdmin = adminIDs.includes(senderID);
    const isBot = senderID === botID;

    // যদি ইউজার অ্যাডমিন বা বট হয়, তবে সিকিউরিটি চেক করবে না
    if (isAdmin || isBot) return;

    // কিক করার আগে বট নিজে অ্যাডমিন কি না চেক করার লজিক
    const kickUser = async (reason) => {
      if (!adminIDs.includes(botID)) {
        return message.reply(`Security Alert: ${reason} detected, but I cannot remove the user because I am not an admin in this group.`);
      }
      try {
        await api.removeUserFromGroup(senderID, threadID);
        return message.reply(`Security Alert: User removed for ${reason}.`);
      } catch (e) { 
        console.error(e); 
      }
    };

    // 1. Anti-Link Protection
    if (config.antilink && (body.includes("http://") || body.includes("https://") || body.includes("www."))) {
      return await kickUser("sharing unauthorized links");
    }

    // 2. Anti-Tag All Protection (@everyone / @all)
    if (config.antitag && (body.includes("@everyone") || body.includes("@all"))) {
      return await kickUser("tagging everyone");
    }
  }
};
