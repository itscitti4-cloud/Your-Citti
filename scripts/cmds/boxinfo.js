module.exports = {
  config: {
    name: "boxinfo",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "AkHi",
    description: "box full information",
    commandCategory: "Group",
    usages: "boxinfo",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    try {
      // গ্রুপের সকল তথ্য সংগ্রহ
      const threadInfo = await api.getThreadInfo(threadID);
      const { threadName, participantIDs, approvalMode, emoji, adminIDs, messageCount } = threadInfo;

      // মেম্বারদের জেন্ডার অনুযায়ী সংখ্যা গণনা
      let maleCount = 0;
      let femaleCount = 0;
      
      // ইউজার ডিটেইলস সংগ্রহ (জেন্ডার চেক করার জন্য)
      const usersData = await api.getUserInfo(participantIDs);
      
      for (const id in usersData) {
        if (usersData[id].gender === 2) maleCount++; // 2 সাধারণত Male
        else if (usersData[id].gender === 1) femaleCount++; // 1 সাধারণত Female
      }

      // অ্যাডমিনদের নাম সংগ্রহ
      let adminList = [];
      for (const admin of adminIDs) {
        const info = await api.getUserInfo(admin.id);
        adminList.push(info[admin.id].name);
      }

      const approvalStatus = approvalMode ? "Turn On" : "Turn Off";
      const botAdminID = global.config.ADMINBOT[0] || "Not Set"; // বটের কনফিগ থেকে অ্যাডমিন আইডি

      // মেসেজ ফরম্যাট করা
      const infoMessage = `*Group Information*
Box Name : ${threadName || "No Name"}
Box Id : ${threadID}
Approval: ${approvalStatus}
Emoji: ${emoji || "None"}
Information: ${participantIDs.length} members
Males : ${maleCount}
Female: ${femaleCount}
Total Administor: ${adminIDs.length}
Admin list: ${adminList.join(", ")}

Total message: ${messageCount}

Bot Admin: Lubna Jannat
      `.trim();

      return api.sendMessage(infoMessage, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("Something went wrong", threadID, messageID);
    }
  }
};
