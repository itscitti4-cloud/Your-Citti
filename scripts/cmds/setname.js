const fs = require('fs');

if (!global.setnameStatus) global.setnameStatus = new Map();

module.exports = {
  config: {
    name: "setname",
    version: "2.6.0",
    author: "Nawab",
    countDown: 3,
    role: 0,
    description: "Advanced nickname setter (Skips Bot ID in EX command)",
    category: "admin",
    guide: {
      en: "{p}setname on/off | {p}setname ex on/off | {p}setname c [name] (reply/mention/uid/self)"
    }
  },

  onStart: async function ({ api, event, args, threadsData, usersData, role }) {
    const { threadID, senderID, messageReply, mentions } = event;
    const botID = api.getCurrentUserID(); // বটের আইডি নেওয়া হলো
    const threadInfo = await api.getThreadInfo(threadID);
    
    // Admin Check
    const isAdmin = role >= 1 || threadInfo.adminIDs.some(admin => admin.id == senderID);
    
    const specialAdmins = {
      "61585634146171": "The Nawab 🥀",
      "61583939430347": "It's AkHi 🦋",
      "61585313847243": "Your Citti"
    };

    // --- !setname on/off ---
    if (args[0] === "on" || args[0] === "off") {
      if (!isAdmin) return api.sendMessage("⛔ | Only Admins can use this.", threadID);
      const data = await threadsData.get(threadID) || {};
      data.autoNickname = args[0] === "on";
      await threadsData.set(threadID, data);
      return api.sendMessage(`✅ | Auto-nickname has been ${args[0].toUpperCase()}ED.`, threadID);
    }

    // --- !setname c [name] Logic ---
    if (args[0] === "c") {
      let targetID, customName;

      if (event.type === "message_reply") {
        targetID = messageReply.senderID;
        customName = args.slice(1).join(" ");
      } 
      else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        customName = args.slice(1).join(" ").replace(/@\[.+?\]/g, "").trim();
      } 
      else if (args.length > 2 && /^\d{10,16}$/.test(args[args.length - 1])) {
        targetID = args[args.length - 1];
        customName = args.slice(1, -1).join(" ");
      } 
      else {
        targetID = senderID;
        customName = args.slice(1).join(" ");
      }

      if (!customName) return api.sendMessage("❌ | Please provide a name.", threadID);

      try {
        await api.changeNickname(customName, threadID, targetID);
        return api.sendMessage(`✅ | Nickname set for ${targetID == senderID ? "you" : "the user"}.`, threadID);
      } catch (e) {
        return api.sendMessage("❌ | Failed to change nickname.", threadID);
      }
    }

    // --- !setname ex on/off ---
    if (args[0] === "ex" && args[1] === "on") {
      if (!isAdmin) return api.sendMessage("⛔ | Only Admins can use this.", threadID);
      const { nicknames, participantIDs } = threadInfo;
      global.setnameStatus.set(threadID, true);
      
      api.sendMessage("⏳ | Processing old members... (3s interval)", threadID);
      
      for (const id of participantIDs) {
        // বটের আইডি হলে স্কিপ করবে অথবা যদি প্রসেস অফ করে দেওয়া হয়
        if (!global.setnameStatus.get(threadID)) break;
        if (id == botID) continue; 

        const userInfo = await usersData.get(id);
        const firstName = (userInfo.name || "User").split(" ")[0];
        const expectedName = `${firstName} 🌸`;

        if (nicknames[id] !== expectedName) {
          const finalName = specialAdmins[id] ? specialAdmins[id] : expectedName;
          await new Promise(res => setTimeout(res, 3000));
          
          // চেক করার ঠিক আগে আবার নিশ্চিত হওয়া যে প্রসেসটি অফ হয়নি
          if (!global.setnameStatus.get(threadID)) break;
          
          await api.changeNickname(finalName, threadID, id);
        }
      }
      global.setnameStatus.delete(threadID);
      return api.sendMessage("✅ | Scan completed (Bot ID skipped).", threadID);
    }

    if (args[0] === "ex" && args[1] === "off") {
      global.setnameStatus.set(threadID, false);
      return api.sendMessage("🛑 | Force stopped.", threadID);
    }
  },

  onChat: async function ({ api, event, threadsData }) {
    const { threadID, logMessageType, logMessageData } = event;
    const specialAdmins = {
      "61585634146171": "The Nawab 🥀",
      "61583939430347": "It's AkHi 🦋"
    };

    if (logMessageType === "log:subscribe") {
      const addedParticipants = logMessageData.addedParticipants;
      const data = await threadsData.get(threadID) || {};

      for (const participant of addedParticipants) {
        const userID = participant.userFbId;
        
        if (specialAdmins[userID]) {
          setTimeout(() => api.changeNickname(specialAdmins[userID], threadID, userID), 3000);
        } else if (data.autoNickname) {
          const firstName = participant.fullName.split(" ")[0];
          setTimeout(() => api.changeNickname(`${firstName} 🌸`, threadID, userID), 3000);
        }
      }
    }
  }
};
