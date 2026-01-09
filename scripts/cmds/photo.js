module.exports = {
  config: {
    name: "photo",
    aliases: ["pic", "picture"],
    version: "2.0.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "URL to Picture. profile link to profile picture. (FB, Insta, TikTok, Twitter, Threads)",
    category: "media",
    guide: "!pic [link]",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const url = args[0];

    if (!url) {
      return api.sendMessage("Please enter your correct URL (FB, Insta, TikTok, Twitter, or Threads)।", threadID, messageID);
    }

    api.sendMessage("Processing", threadID, messageID);

    try {
      // এখানে একটি মাল্টি-ডাউনলোডার API ব্যবহার করা হয়েছে যা সব প্ল্যাটফর্ম সাপোর্ট করে
      const res = await api.httpGet(`https://api.samirxp.repl.co/download?url=${encodeURIComponent(url)}`);
      
      // দ্রষ্টব্য: যদি উপরের API কাজ না করে, তবে আপনি অন্য কোনো working API (যেমন: tikwm, savefrom) ব্যবহার করতে পারেন।
      const data = res.data;

      if (!data || !data.images || data.images.length === 0) {
        // যদি প্রোফাইল পিকচার হয়, তবে রেজাল্ট চেক করা
        if (data.profilePic) {
           const stream = await api.httpGet(data.profilePic, { responseType: "stream" });
           return api.sendMessage({ attachment: stream.data }, threadID, messageID);
        }
        return api.sendMessage("❌ Sorry, Picture not found from the URL", threadID, messageID);
      }

      const attachments = [];
      for (const imageUrl of data.images) {
        const stream = await api.httpGet(imageUrl, { responseType: "stream" });
        attachments.push(stream.data);
      }

      return api.sendMessage({
        body: `✅ That's your requested picture 🌸(HD Quality)`,
        attachment: attachments
      }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("⚠️ API is Death", threadID, messageID);
    }
  }
};
