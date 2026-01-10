const spamTracker = new Map();

module.exports = {
  config: {
    name: "spamdetect",
    version: "1.0.1",
    author: "AkHi",
    countDown: 5,
    role: 1, // Admins only can toggle
    shortDescription: "Detect and stop message spamming in the group.",
    longDescription: "Automatically identifies users sending duplicate or rapid messages and takes action.",
    category: "admin",
    guide: "{pn} on | off"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    if (!global.spamProtect) global.spamProtect = new Map();

    const mode = args[0]?.toLowerCase();

    if (mode === "on") {
      global.spamProtect.set(threadID, true);
      return message.reply("Spam Detector has been enabled. I am now monitoring for spammers.");
    } else if (mode === "off") {
      global.spamProtect.set(threadID, false);
      return message.reply("Spam Detector has been disabled.");
    } else {
      return message.reply("Usage: !spamdetect on | off");
    }
  },

  onChat: async function ({ api, event, message }) {
    const { threadID, senderID, body } = event;

    // Check if protector is active
    if (!global.spamProtect || !global.spamProtect.get(threadID)) return;

    // সরাসরি ফেসবুক থেকে রিয়েল-টাইম ডাটা নেওয়া
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

    // Skip bot and admins
    if (senderID === botID || adminIDs.includes(senderID)) return;

    const userKey = `${threadID}_${senderID}`;
    const now = Date.now();
    const userData = spamTracker.get(userKey) || { lastMsg: "", count: 0, time: now };

    // Detection Logic: Same message OR rapid succession
    if (userData.lastMsg === body || (now - userData.time < 2000)) {
      userData.count++;
    } else {
      userData.count = 1;
    }

    userData.lastMsg = body;
    userData.time = now;
    spamTracker.set(userKey, userData);

    // Warning at 4 messages
    if (userData.count === 4) {
      return message.reply("⚠️ Warning: Stop spamming or you will be removed from this group!");
    }

    // Kick at 6 messages
    if (userData.count >= 6) {
      // কিক করার আগে বট নিজে অ্যাডমিন কি না চেক করা
      if (!adminIDs.includes(botID)) {
        spamTracker.delete(userKey); // রিসেট করা হলো যাতে বারবার মেসেজ না দেয়
        return message.reply("🚫 Security Alert: Spam detected, but I cannot remove the user because I am not an admin in this group.");
      }

      spamTracker.delete(userKey);
      try {
        await api.removeUserFromGroup(senderID, threadID);
        return api.sendMessage("🚫 Security Action: User has been kicked for persistent spamming.", threadID);
      } catch (e) {
        console.error("Spam Detect Error:", e);
      }
    }
  }
};
