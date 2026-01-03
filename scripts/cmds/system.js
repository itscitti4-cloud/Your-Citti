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
    const adminID = "61583939430347", "61585634146171"; // আপনার অ্যাডমিন আইডি

    if (senderID !== adminID) {
      return api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nYou don't have permission to use this command.\n╚════ஜ۩۞۩ஜ═══╝", threadID, messageID);
    }

    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    // --- পুরো সিস্টেম অফ/অন লজিক ---
    if (action === "off" && !subAction) {
      global.isBotOff = true;
      return api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nSuccessfully Turned Off System ✅\n╚════ஜ۩۞۩ஜ═══╝", threadID, messageID);
    }
    
    if (action === "on" && !subAction) {
      global.isBotOff = false;
      return api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nSystem is now Online ✅\n╚════ஜ۩۞۩ஜ═══╝", threadID, messageID);
    }

    // --- নির্দিষ্ট চ্যাট অফ/অন লজিক ---
    if (action === "chat") {
      if (subAction === "off") {
        await threadsData.set(threadID, { isChatOff: true }, "data");
        return api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nBot is now OFF for this Group ❌\n╚════ஜ۩۞۩ஜ═══╝", threadID, messageID);
      } 
      else if (subAction === "on") {
        await threadsData.set(threadID, { isChatOff: false }, "data");
        return api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nBot is now ON for this Group ✅\n╚════ஜ۩۞۩ஜ═══╝", threadID, messageID);
      }
    }

    return api.sendMessage("usage:\n!system off/on\n!system chat off/on", threadID, messageID);
  },

  // এই অংশটি অন্য কমান্ড ব্লক করার জন্য দায়ী
  onChat: async function ({ event, threadsData, isCommand }) {
    if (!event.body || event.senderID === "61583939430347") return;

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
