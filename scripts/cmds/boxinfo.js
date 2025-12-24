const axios = require("axios");

module.exports = {
  config: {
    name: "boxinfo",
    version: "1.0.0",
    role: 2,
    author: "AkHi",
    description: "Get detailed information about the group.",
    category: "information",
    guides: "{p}boxinfo",
    countDown: 2
  },

  onStart: async function ({ api, event, threadsData }) {
    const { threadID } = event;

    try {
      // গ্রুপের সকল তথ্য সংগ্রহ
      const threadInfo = await api.getThreadInfo(threadID);
      const { threadName, participantIDs, adminIDs, approvalMode, emoji } = threadInfo;

      // লিঙ্গ ভিত্তিক সদস্য গণনা
      let maleCount = 0;
      let femaleCount = 0;

      for (const id of participantIDs) {
        const userInfo = await api.getUserInfo(id);
        if (userInfo[id].gender === "male") maleCount++;
        else if (userInfo[id].gender === "female") femaleCount++;
      }

      // কভার ফটো বা থিম ইমেজ (এখানে গ্রুপের বড় ছবি ব্যবহার করা হয়েছে)
      const groupIcon = threadInfo.imageSrc || "https://i.imgur.com/6eSrt99.png"; 

      const infoMessage = `
✨ 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 ✨
▬▬▬▬▬▬▬▬▬▬▬▬▬▬

📝 𝗡𝗮𝗺𝗲: ${threadName || "No Name"}
🆔 𝗜𝗗: ${threadID}
🎨 𝗧𝗵𝗲𝗺𝗲: ${threadInfo.color || "Default"}
🎭 𝗘𝗺𝗼𝗷𝗶: ${emoji || "👍"}
🛡️ 𝗔𝗽𝗽𝗿𝗼𝘃𝗮𝗹 𝗠𝗼𝗱𝗲: ${approvalMode ? "On" : "Off"}

👥 𝗧𝗼𝘁𝗮𝗹 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${participantIDs.length}
👮 𝗔𝗱𝗺𝗶𝗻𝘀: ${adminIDs.length}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬
👑 𝗕𝗼𝘁 𝗢𝘄𝗻𝗲𝗿: Lubna Jannat AkHi`;

      // ছবিসহ মেসেজ পাঠানো
      const imageStream = (await axios.get(groupIcon, { responseType: "stream" })).data;

      return api.sendMessage({
        body: infoMessage,
        attachment: imageStream
      }, threadID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("তথ্য সংগ্রহ করতে সমস্যা হয়েছে।", threadID);
    }
  }
};
