module.exports = {
  config: {
    name: "system",
    version: "2.0",
    author: "AkHi",
    countDown: 5,
    role: 2,
    shortDescription: "বট অফ বা অন করা",
    longDescription: "পুরো সিস্টেম বা নির্দিষ্ট চ্যাটে বট অফ/অন করুন",
    category: "Admin",
    guide: "{pn} [off/on] অথবা {pn} chat [off/on]"
  },

  onStart: async function ({ event, api, args, threadsData }) {
    const { threadID, messageID, senderID } = event;
    const permission = ["61583939430347"]; // আপনার অ্যাডমিন আইডি

    if (!permission.includes(senderID)) {
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
      let data = await threadsData.get(threadID) || {};
      if (subAction === "off") {
        data.isChatOff = true;
        await threadsData.set(threadID, data);
        return api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nBot is now OFF for this Group ❌\n╚════ஜ۩۞۩ஜ═══╝", threadID, messageID);
      } 
      else if (subAction === "on") {
        data.isChatOff = false;
        await threadsData.set(threadID, data);
        return api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nBot is now ON for this Group ✅\n╚════ஜ۩۞۩ஜ═══╝", threadID, messageID);
      }
    }

    return api.sendMessage("ব্যবহারবিধি:\n!offbot off/on (সিস্টেমের জন্য)\n!offbot chat off/on (গ্রুপের জন্য)", threadID, messageID);
  },

  // এই অংশটি নিশ্চিত করবে বট কমান্ড ছাড়া অন্য কিছুতে রেসপন্স করবে না
  onChat: async function ({ event, threadsData }) {
    const { threadID, body } = event;
    if (!body) return;

    // যদি পুরো সিস্টেম অফ থাকে
    if (global.isBotOff && !body.startsWith("!offbot on")) {
      return false; 
    }

    // যদি নির্দিষ্ট চ্যাট অফ থাকে
    let data = await threadsData.get(threadID);
    if (data && data.isChatOff && !body.startsWith("!offbot chat on")) {
      return false;
    }
  }
};
