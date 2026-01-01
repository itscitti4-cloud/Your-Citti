module.exports = {
  config: {
    name: "check",
    version: "1.0.0",
    role: 4,
    author: "AkHi",
    description: "বটের সব ফাংশন লিস্ট দেখার কমান্ড",
    category: "system",
    guide: "{pn}",
    countDown: 5
  },

  onStart: async function ({ api, event }) {
    try {
      // api অবজেক্টের সব ফাংশনের নাম বের করা
      const apiFunctions = Object.keys(api).filter(key => typeof api[key] === 'function');
      
      let msg = "✅ Your Bot API Functions:\n\n";
      msg += apiFunctions.join(", ");

      // মেসেজটি অনেক বড় হতে পারে, তাই কনসোলেও প্রিন্ট করা হলো
      console.log("--- API FUNCTIONS LIST ---");
      console.log(apiFunctions);
      console.log("--------------------------");

      return api.sendMessage(msg, event.threadID);
    } catch (e) {
      return api.sendMessage("Error: " + e.message, event.threadID);
    }
  }
};
