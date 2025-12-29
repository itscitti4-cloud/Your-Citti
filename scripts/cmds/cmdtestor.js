const axios = require("axios");

module.exports = {
  config: {
    name: "command_testor",
    aliases: ["ct", "cmdtest"],
    version: "1.0.0",
    author: "AkHi",
    countDown: 2,
    role: 2, // শুধুমাত্র অ্যাডমিনদের জন্য (নিরাপত্তার খাতিরে)
    shortDescription: "Test any JavaScript command code",
    category: "owner",
    guide: "{pn} <javascript code>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    let code = args.join(" ");

    if (!code) return api.sendMessage("❌ টেস্ট করার জন্য কোড দিন।", threadID, messageID);

    try {
      // module.exports অংশটি সরিয়ে শুধুমাত্র অবজেক্টটি নেওয়ার চেষ্টা
      const cleanCode = code.replace(/module\.exports\s*=\s*/, "").trim();
      
      // কোডটিকে অবজেক্টে রূপান্তর
      let tempCommand;
      try {
        tempCommand = eval(`(${cleanCode})`);
      } catch (e) {
        return api.sendMessage(`❌ সিনট্যাক্স এরর (Syntax Error):\n${e.message}`, threadID, messageID);
      }

      // ফরম্যাট ভ্যালিডেশন
      if (!tempCommand.config || !tempCommand.onStart) {
        return api.sendMessage("📝 প্রবলেম: কোডে 'config' অথবা 'onStart' ফাংশনটি খুঁজে পাওয়া যায়নি।", threadID, messageID);
      }

      api.sendMessage("⏳ কমান্ডটি রান করে পরীক্ষা করা হচ্ছে...", threadID, async (err, info) => {
        try {
          // ফেক এনভায়রনমেন্ট দিয়ে অনস্টার্ট রান করা
          await tempCommand.onStart({ 
            api, 
            event, 
            args: [], 
            Threads: {}, 
            Users: {}, 
            Currencies: {} 
          });
          
          api.sendMessage(`✅ পারফেক্ট! কমান্ডটি সঠিক আছে।\n\n🔹 নাম: ${tempCommand.config.name}\n🔹 লেখক: ${tempCommand.config.author}`, threadID);
        } catch (runError) {
          api.sendMessage(`⚠️ কোড সঠিক কিন্তু রান করার সময় এরর আসছে:\n❌ ${runError.message}`, threadID);
        }
      }, messageID);

    } catch (globalError) {
      api.sendMessage(`❌ মারাত্মক সমস্যা:\n${globalError.message}`, threadID, messageID);
    }
  }
};
            
