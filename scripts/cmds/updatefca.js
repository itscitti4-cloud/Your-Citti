const { exec } = require("child_process");

module.exports = {
  config: {
    name: "updatefca",
    version: "1.0.0",
    role: 2, // শুধুমাত্র অ্যাডমিন ব্যবহার করতে পারবে
    author: "AkHi",
    description: "Update FCA Library directly from Messenger",
    category: "system",
    guide: {
        en: "[!updatefca library_name]"
    },
    countDown: 10
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    
    // লাইব্রেরির নাম ইনপুট না দিলে ডিফল্ট নাম সেট করুন
    // আপনার package.json এ যে নাম আছে সেটি এখানে দিন (যেমন: fca-project-uno)
    const libraryName = args[0] || "fca-horizon-remake"; 

    api.sendMessage(`AkHi Ma'am, ${libraryName} আপডেট করা শুরু হচ্ছে... দয়া করে অপেক্ষা করুন। ⏳`, threadID, messageID);

    // কমান্ড এক্সিকিউট করা
    exec(`npm install ${libraryName}@latest`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return api.sendMessage(`❌ আপডেট ব্যর্থ হয়েছে!\nভুল: ${error.message}`, threadID, messageID);
      }
      if (stderr && !stderr.includes("WARN")) {
        console.error(`Stderr: ${stderr}`);
      }

      console.log(`Stdout: ${stdout}`);
      api.sendMessage(`✅ AkHi Ma'am, ${libraryName} সফলভাবে আপডেট হয়েছে!\nবটটি রিস্টার্ট দিন যাতে পরিবর্তনগুলো কার্যকর হয়।`, threadID, messageID);
    });
  }
};
