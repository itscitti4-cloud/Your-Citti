const axios = require("axios");

module.exports = {
  config: {
    name: "command_testor",
    aliases: ["ct", "cmdtest"],
    version: "1.2.0",
    author: "AkHi",
    countDown: 2,
    role: 2,
    shortDescription: "Advanced Command Tester",
    category: "owner",
    guide: "{p}ct <javascript code>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    let code = args.join(" ");

    if (!code) return api.sendMessage("❌ Please provide the code to test.", threadID, messageID);

    try {
      // ১. কোড থেকে অপ্রয়োজনীয় অংশ পরিষ্কার করা
      let cleanCode = code
        .replace(/const\s+.*=.*require\(.*\);?/g, "") // const require লাইনগুলো সরাবে
        .replace(/module\.exports\s*=\s*/, "")        // module.exports সরাবে
        .trim();

      // ২. কোডের শেষে সেমিকোলন থাকলে তা সরাবে (eval এরর এড়াতে)
      if (cleanCode.endsWith(";")) {
        cleanCode = cleanCode.slice(0, -1);
      }

      // ৩. কোডটিকে অবজেক্টে রূপান্তর করা
      let tempCommand;
      try {
        tempCommand = eval(`(${cleanCode})`);
      } catch (e) {
        return api.sendMessage(`❌ Syntax Error:\n${e.message}`, threadID, messageID);
      }

      // ৪. ফরম্যাট চেক
      if (!tempCommand || !tempCommand.config || !tempCommand.onStart) {
        return api.sendMessage("📝 Error: Missing 'config' or 'onStart' function in your code.", threadID, messageID);
      }

      api.sendMessage("⏳ AkHi Ma'am, testing the command... please wait.", threadID, async () => {
        try {
          // ফেক ডাটা দিয়ে টেস্ট রান
          await tempCommand.onStart({ 
            api, 
            event, 
            args: [], 
            Threads: { setData: () => {}, getName: () => "Test Thread" }, 
            Users: { setData: () => {}, getName: () => "Test User" }, 
            Currencies: { setData: () => {}, get: () => 0 } 
          });
          
          api.sendMessage(`✅ Perfect! The code is valid.\n\n🔹 Name: ${tempCommand.config.name}\n🔹 Author: ${tempCommand.config.author}`, threadID);
        } catch (runError) {
          api.sendMessage(`⚠️ Code is valid but failed during execution:\n❌ ${runError.message}`, threadID);
        }
      }, messageID);

    } catch (globalError) {
      api.sendMessage(`❌ Critical Error:\n${globalError.message}`, threadID, messageID);
    }
  }
};
