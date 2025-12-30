const axios = require("axios");

module.exports = {
  config: {
    name: "command_testor",
    aliases: ["ct", "cmdtest"],
    version: "2.0.0",
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
      // কোড থেকে অপ্রয়োজনীয় অংশ পরিষ্কার করা
      let cleanCode = code
        .replace(/const\s+.*=.*require\(.*\);?/g, "")
        .replace(/module\.exports\s*=\s*/, "")
        .trim();

      if (cleanCode.endsWith(";")) cleanCode = cleanCode.slice(0, -1);

      let tempCommand;
      try {
        // নতুন Function কনস্ট্রাক্টর ব্যবহার করা হয়েছে এরর ডিবাগিং সহজ করতে
        tempCommand = eval(`(${cleanCode})`);
      } catch (e) {
        // এরর এর স্ট্যাক ট্রেস থেকে লাইন নম্বর বের করা
        const stack = e.stack.split('\n');
        const lineInfo = stack[1] ? stack[1].match(/<anonymous>:(\d+):(\d+)/) : null;
        const lineMsg = lineInfo ? `\n📍 Error at Line: ${lineInfo[1]}, Column: ${lineInfo[2]}` : "";
        
        return api.sendMessage(`❌ Syntax Error: ${e.message}${lineMsg}`, threadID, messageID);
      }

      if (!tempCommand || !tempCommand.config || !tempCommand.onStart) {
        return api.sendMessage("📝 Error: Missing 'config' or 'onStart' function.", threadID, messageID);
      }

      // স্যাম্পল আউটপুট দেখানোর জন্য একটি ইন্টারসেপ্টর
      const originalSendMessage = api.sendMessage;
      let sampleOutput = "";
      
      // ফেক sendMessage ফাংশন যাতে আউটপুট ক্যাপচার করা যায়
      const fakeApi = {
        ...api,
        sendMessage: (msg, tid, mid) => {
          sampleOutput = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
          return originalSendMessage(msg, tid, mid);
        }
      };

      api.sendMessage("⏳ Testing execution & capturing sample output...", threadID, async () => {
        try {
          await tempCommand.onStart({ 
            api: fakeApi, 
            event, 
            args: ["test"], // স্যাম্পল আর্গুমেন্ট
            Threads, 
            Users, 
            Currencies 
          });
          
          let resultMsg = `✅ Code is Valid!\n\n🔹 Name: ${tempCommand.config.name}\n🔹 Author: ${tempCommand.config.author}\n\n🖼️ **Sample Output:**\n--------------------\n${sampleOutput || "No direct message sent during test."}`;
          
          api.sendMessage(resultMsg, threadID);
        } catch (runError) {
          const runStack = runError.stack.split('\n')[1];
          api.sendMessage(`⚠️ Execution Error: ${runError.message}\n🔍 Trace: ${runStack}`, threadID);
        }
      }, messageID);

    } catch (globalError) {
      api.sendMessage(`❌ Critical Error: ${globalError.message}`, threadID, messageID);
    }
  }
};
