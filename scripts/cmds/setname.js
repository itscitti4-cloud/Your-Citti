const fs = require('fs');

// প্রসেস কন্ট্রোল করার জন্য গ্লোবাল ভ্যারিয়েবল
if (!global.setnameStatus) global.setnameStatus = new Map();

module.exports = {
  config: {
    name: "setname",
    version: "2.1.0",
    author: "Nawab",
    countDown: 3,
    role: 0, // 0 মানে সবাই ট্রাই করতে পারবে, কিন্তু ভেতরে আমরা অ্যাডমিন চেক বসিয়েছি
    description: "Advanced auto-nickname setter for members and specific IDs.",
    category: "admin",
    guide: {
      en: "{p}setname on/off/ex on/ex off/c [name]"
    }
  },

  onStart: async function ({ api, event, args, threadsData, usersData, role }) {
    const { threadID, senderID } = event;
    const threadInfo = await api.getThreadInfo(threadID);
    
    // অ্যাডমিন চেক (বট অ্যাডমিন অথবা গ্রুপ অ্যাডমিন)
    const isAdmin = role >= 1 || threadInfo.adminIDs.some(admin => admin.id == senderID);
    if (!isAdmin && args[0] !== "c") {
      return api.sendMessage("⛔ | You do not have permission to use this command. Only Group/Bot Admins can use it.", threadID);
    }

    const data = await threadsData.get(threadID) || {};
    const specialAdmins = {
      "61585634146171": "The Nawab 🥀",
      "61583939430347": "It's AkHi 🦋"
    };

    // !setname on
    if (args[0] === "on") {
      data.autoNickname = true;
      await threadsData.set(threadID, data);
      return api.sendMessage("✅ | Auto-nickname has been enabled. New members will be named: [FirstName] 🌸", threadID);
    }

    // !setname off
    if (args[0] === "off") {
      data.autoNickname = false;
      await threadsData.set(threadID, data);
      return api.sendMessage("❌ | Auto-nickname has been disabled.", threadID);
    }

    // !setname c [name]
    if (args[0] === "c" && args.length > 1) {
      const customName = args.slice(1).join(" ");
      await api.changeNickname(customName, threadID, senderID);
      return api.sendMessage(`✅ | Your nickname has been set to: ${customName}`, threadID);
    }

    // !setname ex on
    if (args[0] === "ex" && args[1] === "on") {
      const { nicknames, participantIDs } = threadInfo;
      global.setnameStatus.set(threadID, true);
      
      api.sendMessage("⏳ | Processing old members... (3s interval)", threadID);
      
      for (const id of participantIDs) {
        if (!global.setnameStatus.get(threadID)) break; // যদি অফ করা হয় তবে লুপ থামবে

        const userInfo = await usersData.get(id);
        const firstName = userInfo.name.split(" ")[0];
        const expectedName = `${firstName} 🌸`;

        if (nicknames[id] !== expectedName) {
          const finalName = specialAdmins[id] ? specialAdmins[id] : expectedName;
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          await api.changeNickname(finalName, threadID, id);
        }
      }
      global.setnameStatus.delete(threadID);
      return api.sendMessage("✅ | 'ex' command process completed.", threadID);
    }

    // !setname ex off
    if (args[0] === "ex" && args[1] === "off") {
      global.setnameStatus.set(threadID, false);
      return api.sendMessage("🛑 | Execution stopped forcefully.", threadID);
    }
  },

  // নতুন মেম্বার জয়েন করলে এবং স্পেশাল আইডি জয়েন করলে
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
        
        // ১. স্পেশাল আইডি চেক (সর্বদা কার্যকর)
        if (specialAdmins[userID]) {
          setTimeout(async () => {
            await api.changeNickname(specialAdmins[userID], threadID, userID);
          }, 3000);
        } 
        // ২. অটো নিকনেম অন থাকলে
        else if (data.autoNickname) {
          const firstName = participant.fullName.split(" ")[0];
          setTimeout(async () => {
            await api.changeNickname(`${firstName} 🌸`, threadID, userID);
          }, 3000);
        }
      }
    }
  }
};
	  
