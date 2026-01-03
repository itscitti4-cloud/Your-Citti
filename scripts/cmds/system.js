module.exports = {
  config: {
    name: "system",
    version: "3.0",
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
    const adminIDs = ["61583939430347", "61585634146171"]; // আপনার অ্যাডমিন আইডি

    if (!adminIDs.includes(senderID)) {
  return api.sendMessage("❌ Access Denied! Only Developers (Sabu and AkHi) Can use this command.", threadID, messageID);
    }

    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    // --- পুরো সিস্টেম অফ/অন লজিক ---
    if (action === "off" && !subAction) {
      global.isBotOff = true;
      return api.sendMessage("System Turned Off Successfully ✅", threadID, messageID);
    }
    
    if (action === "on" && !subAction) {
      global.isBotOff = false;
      return api.sendMessage("System is now Online ✅", threadID, messageID);
    }

    // --- নির্দিষ্ট চ্যাট অফ/অন লজিক ---
    if (action === "chat") {
      if (subAction === "off") {
        await threadsData.set(threadID, { isChatOff: true }, "data");
        return api.sendMessage("Bot is now OFF for this Group ✅", threadID, messageID);
      } 
      else if (subAction === "on") {
        await threadsData.set(threadID, { isChatOff: false }, "data");
        return api.sendMessage("Bot is now ON for this Group ✅", threadID, messageID);
      }
    }

    return api.sendMessage("usage:\n!system off/on\n!system chat off/on", threadID, messageID);
  },

  // এই অংশটি অন্য কমান্ড ব্লক করার জন্য দায়ী
  onChat: async function ({ event, threadsData, isCommand }) {
    if (!event.body || ["61583939430347", "61585634146171"].includes(event.senderID)) return;

    // ১. পুরো সিস্টেম অফ থাকলে
    if (global.isBotOff) {
      // যদি ইউজার কমান্ড দেয় (যেমন !help বা অন্য কিছু), তবে সেটি কাজ করবে না
      if (isCommand || event.body.startsWith("!")) {
        return false; 
      }
    }

    // ২. নির্দিষ্ট চ্যাট অফ থাকলে
    const data = await threadsData.get(event.threadID);
    if (data && data.isChatOff) {
      if (isCommand || event.body.startsWith("!")) {
        return false;
      }
    }
  }
};
