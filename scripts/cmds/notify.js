module.exports = {
  config: {
    name: "notify",
    version: "1.5.0",
    role: 2, // শুধুমাত্র অ্যাডমিন
    author: "AkHi",
    description: "সব গ্রুপে নোটিফিকেশন পাঠান",
    commandCategory: "admin",
    usages: pn"[মেসেজ]",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const text = args.join(" ");
    if (!text) return api.sendMessage("⚠️ নোটিফিকেশনে কি লিখতে চান?", threadID, messageID);

    // সব গ্রুপের আইডি নেওয়া
    const allThreads = await api.getThreadList(100, null, ["INBOX"]);
    let successCount = 0;
    let failCount = 0;

    api.sendMessage("⏳ নোটিফিকেশন পাঠানো শুরু হচ্ছে...", threadID);

    for (const thread of allThreads) {
      if (thread.isGroup && thread.threadID !== threadID) {
        try {
          await api.sendMessage(`📢 **অ্যাডমিন নোটিফিকেশন** 📢\n\n${text}`, thread.threadID);
          successCount++;
          // সার্ভার ওভারলোড এড়াতে সামান্য বিরতি
          await new Promise(resolve => setTimeout(resolve, 500)); 
        } catch (e) {
          failCount++;
        }
      }
    }

    return api.sendMessage(`✅ পাঠানো শেষ!\n🟢 সফল: ${successCount}\n🔴 ব্যর্থ: ${failCount}`, threadID);
  }
};
