const axios = require("axios");

module.exports = {
  config: {
    name: "command_testor",
    aliases: ["ct", "cmdtest"],
    version: "2.1.0",
    author: "AkHi",
    countDown: 2,
    role: 2,
    shortDescription: "Improved Command Tester with Debugging",
    category: "owner",
    guide: "{p}ct <javascript code>"
  },

  onStart: async function ({ api, event, args, Users, Threads, Currencies }) {
    const { threadID, messageID } = event;
    let code = args.join(" ");

    if (!code) return api.sendMessage("❌ Please provide the code to test.", threadID, messageID);

    try {
      // ১. কোড থেকে অপ্রয়োজনীয় require এবং exports অংশ রিমুভ করা
      // এটি মূলত module.exports অবজেক্টটি খুঁজে বের করে
      let cleanCode = code
        .replace(/const\s+.*=.*require\(.*\);?/g, "") // require রিমুভ
        .replace(/module\.exports\s*=\s*/, "")        // module.exports রিমুভ
        .trim();

      // ২. শেষের সেমিকোলন রিমুভ করা (eval এর ভেতরে ব্র্যাকেট এরর এড়াতে)
      if (cleanCode.endsWith(";")) {
        cleanCode = cleanCode.slice(0, -1);
      }

      let tempCommand;
      try {
        // eval করার সময় সরাসরি অবজেক্ট হিসেবে ধরার চেষ্টা
        tempCommand = eval(`(${cleanCode})`);
      } catch (e) {
        // যদি ব্র্যাকেট দিয়ে কাজ না হয় (যেমন সাধারণ ফাংশন বা অন্য কিছু), তবে ব্র্যাকেট ছাড়া ট্রাই করবে
        try {
          tempCommand = eval(cleanCode);
        } catch (innerError) {
          const stack = innerError.stack.split('\n');
          const lineInfo = stack[1] ? stack[1].match(/<anonymous>:(\d+):(\d+)/) : null;
          const lineMsg = lineInfo ? `\n📍 Error at Line: ${lineInfo[1]}, Column: ${lineInfo[2]}` : "";
          return api.sendMessage(`❌ Syntax Error: ${innerError.message}${lineMsg}`, threadID, messageID);
        }
      }

      // ৩. কমান্ড স্ট্রাকচার ভ্যালিডেশন
      if (!tempCommand || !tempCommand.config || !tempCommand.onStart) {
        return api.sendMessage("📝 Error: Missing 'config' or 'onStart' function in the provided code.", threadID, messageID);
      }

      // ৪. আউটপুট ক্যাপচার করার জন্য ইন্টারসেপ্টর
      let sampleOutput = "";
      const fakeApi = {
        ...api,
        sendMessage: async (msg, tid, mid) => {
          sampleOutput = typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg;
          return api.sendMessage(msg, tid, mid); // মূল মেসেজটি পাঠাবে
        }
      };

      api.sendMessage("⏳ Testing execution & capturing sample output...", threadID, async () => {
        try {
          await tempCommand.onStart({ 
            api: fakeApi, 
            event, 
            args: ["test"], 
            Threads, 
            Users, 
            Currencies 
          });
          
          let resultMsg = `✅ Code is Valid!\n\n🔹 Name: ${tempCommand.config.name}\n🔹 Author: ${tempCommand.config.author}\n\n🖼️ **Last Captured Output:**\n--------------------\n${sampleOutput || "No direct message sent during test."}`;
          
          api.sendMessage(resultMsg, threadID);
        } catch (runError) {
          api.sendMessage(`⚠️ Execution Error: ${runError.message}`, threadID);
        }
      }, messageID);

    } catch (globalError) {
      api.sendMessage(`❌ Critical Error: ${globalError.message}`, threadID, messageID);
    }
  }
};
