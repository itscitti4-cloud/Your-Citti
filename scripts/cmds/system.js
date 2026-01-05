module.exports = {
  config: {
    name: "system",
    version: "3.1",
    author: "AkHi",
    countDown: 2,
    role: 2,
    shortDescription: "Bot on/off",
    longDescription: "full system on/off",
    category: "Admin",
    guide: "{pn} off/on or {pn} chat off/on"
  },

  onStart: async function ({ event, api, args, threadsData }) {
    const { threadID, messageID, senderID } = event;
    const adminIDs = ["61583939430347", "61585634146171"];

    if (!adminIDs.includes(senderID)) {
      return api.sendMessage("❌ Access Denied! Only Developers (Sabu and AkHi) Can use this command.", threadID, messageID);
    }

    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    if (action === "off" && !subAction) {
      global.isBotOff = true;
      return api.sendMessage("System Turned Off Successfully ✅", threadID, messageID);
    }
    
    if (action === "on" && !subAction) {
      global.isBotOff = false;
      return api.sendMessage("System is now Online ✅", threadID, messageID);
    }

    if (action === "chat") {
      if (subAction === "off") {
        await threadsData.set(threadID, true, "data.isChatOff");
        return api.sendMessage("Bot is now OFF for this Group ✅", threadID, messageID);
      } 
      else if (subAction === "on") {
        await threadsData.set(threadID, false, "data.isChatOff");
        return api.sendMessage("Bot is now ON for this Group ✅", threadID, messageID);
      }
    }

    return api.sendMessage("Usage:\n!system off/on\n!system chat off/on", threadID, messageID);
  },

  onChat: async function ({ event, threadsData }) {
    const { threadID, senderID } = event;
    const adminIDs = ["61583939430347", "61585634146171"];

    // অ্যাডমিনদের জন্য কোনো বাধা নেই
    if (adminIDs.includes(senderID)) return;

    // ১. পুরো সিস্টেম চেক
    if (global.isBotOff) {
      return event.stop(); // এটি ইভেন্টকে এখানেই থামিয়ে দিবে, ফলে সিমসিম কাজ করবে না
    }

    // ২. নির্দিষ্ট চ্যাট চেক
    const threadData = await threadsData.get(threadID);
    if (threadData && threadData.data && threadData.data.isChatOff) {
      return event.stop(); // মেসেজ প্রসেসিং বন্ধ করে দিবে
    }
  }
};
