const axios = require("axios");

module.exports = {
  config: {
    name: "notify",
    version: "2.0.0",
    role: 2, // শুধুমাত্র অ্যাডমিন
    author: "AkHi",
    description: "Send notification to all groups",
    category: "admin",
    guide: {
      en: "{pn} [your message]"
    },
    countDown: 10
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const text = args.join(" ");
    
    if (!text) return api.sendMessage("⚠️ Please Ma'am enter your notice Message", threadID, messageID);

    try {
      // ইউজারের নাম নেওয়া (প্রিমিয়াম লুকের জন্য)
      const senderInfo = await api.getUserInfo(senderID);
      const senderName = senderInfo[senderID].name;

      // সব থ্রেড লিস্ট নেওয়া
      const allThreads = await api.getThreadList(500, null, ["INBOX"]);
      let successCount = 0;
      let failCount = 0;

      const waitMsg = await api.sendMessage("🛰️ 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗻𝗴 𝘁𝗼 𝗮𝗹𝗹 𝗴𝗿𝗼𝘂𝗽𝘀...", threadID);

      for (const thread of allThreads) {
        // শুধুমাত্র গ্রুপে পাঠাবে এবং বর্তমান গ্রুপটি বাদ দেবে
        if (thread.isGroup && thread.threadID !== threadID) {
          try {
            const premiumMsg = 
              `📢 𝗔𝗗𝗠𝗜𝗡 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 📢\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `${text}\n\n` +
              `━━━━━━━━━━━━━━━━━━\n` +
              `👤 𝗦𝗲𝗻𝗱𝗲𝗿: ${senderName}\n` +
              `⏰ 𝗧𝗶𝗺𝗲: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n` +
              `⚠️ 𝗗𝗼 𝗻𝗼𝘁 𝘀𝗽𝗮𝗺 𝘁𝗵𝗶𝘀 𝗺𝗲𝘀𝘀𝗮𝗴𝗲.`;

            await api.sendMessage(premiumMsg, thread.threadID);
            successCount++;
            
            // অ্যান্টি-ব্যান ডিলে (০.৮ সেকেন্ড)
            await new Promise(resolve => setTimeout(resolve, 800)); 
          } catch (e) {
            failCount++;
          }
        }
      }

      // কাজ শেষ হলে স্ট্যাটাস আপডেট
      return api.sendMessage(
        `✅ 𝗡𝗼𝘁𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗲𝗱\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ Ma'am notice Successfully Sent: ${successCount}\n` +
        `🔴 Sorry Ma'am Failed/Skipped: ${failCount}\n` +
        `✨ Task Completed by AkHi`, threadID, messageID);

    } catch (err) {
      return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
    }
  }
};
