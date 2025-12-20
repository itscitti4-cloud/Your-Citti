module.exports = {
  config: {
    name: "boxinfo",
    version: "1.0.0",
    author: "AkHi", // আপনার নাম
    countDown: 5,
    role: 0,
    category: "Group",
    shortDescription: {
      en: "Displays full information about the group."
    },
    longDescription: {
      en: "This command provides details like member count, gender distribution, and admin list."
    },
    guide: {
      en: "{p}boxinfo"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      // গ্রুপের তথ্য সংগ্রহ
      const threadInfo = await api.getThreadInfo(threadID);
      const { threadName, participantIDs, approvalMode, emoji, adminIDs, messageCount } = threadInfo;

      let maleCount = 0;
      let femaleCount = 0;

      // ইউজারদের তথ্য সংগ্রহ (জেন্ডার চেক)
      const usersData = await api.getUserInfo(participantIDs);
      
      for (const id in usersData) {
        const gender = usersData[id].gender;
        if (gender === 2 || gender === "male") maleCount++; 
        else if (gender === 1 || gender === "female") femaleCount++;
      }

      // অ্যাডমিনদের নাম সংগ্রহ (একাধিক অ্যাডমিন থাকলে সুন্দর দেখাবে)
      let adminNames = [];
      const adminData = await api.getUserInfo(adminIDs.map(item => item.id));
      for (const id in adminData) {
        adminNames.push(adminData[id].name);
      }

      const approvalStatus = approvalMode ? "Turn On" : "Turn Off";
      
      // বটের কনফিগ ফাইল থেকে এডমিন আইডি পাওয়ার চেষ্টা
      const botAdminID = global.config?.ADMINBOT?.[0] || "Not Configured";

      const infoMessage = `
Box Name : ${threadName || "No Name"}
Box Id : ${threadID}
Approval: ${approvalStatus}
Emoji: ${emoji || "None"}
Information: ${participantIDs.length} members
Males : ${maleCount}
Female: ${femaleCount}
Total Administor: ${adminIDs.length}
Admin list: ${adminNames.join(", ")}

Total message: ${messageCount}

Bot Admin ID: ${botAdminID}
      `.trim();

      return api.sendMessage(infoMessage, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("AkHi Ma'am, something went wrong while fetching data. 🥺", threadID, messageID);
    }
  }
};
