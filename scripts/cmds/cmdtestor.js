const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

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
    const { threadID, messageID, senderID } = event;
    const code = args.join(" ");

    if (!code) return api.sendMessage("❌ অনুগ্রহ করে টেস্ট করার জন্য কোডটি দিন।", threadID, messageID);

    try {
      // কোডটি ইভালুয়েট করার চেষ্টা
      const tempCommand = eval(code);

      // কমান্ড ফরম্যাট চেক করা
      if (!tempCommand.config || !tempCommand.onStart) {
        throw new Error("Invalid Format: 'config' or 'onStart' function is missing.");
      }

      api.sendMessage("⏳ কোডটি পরীক্ষা করা হচ্ছে...", threadID, async (err, info) => {
        try {
          // অনস্টার্ট ফাংশনটি টেস্ট করা
          await tempCommand.onStart({ api, event, args: [], Threads: {}, Users: {}, Currencies: {} });
          
          api.sendMessage(`✅ কমান্ডটি আপনার বোটের জন্য পারফেক্ট!\n\n🔹 নাম: ${tempCommand.config.name}\n🔹 লেখক: ${tempCommand.config.author}`, threadID);
        } catch (testError) {
          api.sendMessage(`⚠️ কোড সঠিক কিন্তু রান করার সময় এরর আসছে:\n\n❌ ${testError.message}`, threadID);
        }
      });

    } catch (error) {
      // কোডে কোনো ভুল থাকলে তা নির্দিষ্ট করে বলা
      let errorMessage = error.message;
      let errorStack = error.stack.split('\n')[1]; // কোন লাইনে ভুল তা বের করা

      return api.sendMessage(
        `❌ কোডটিতে সমস্যা পাওয়া গেছে!\n\n📝 প্রবলেম: ${errorMessage}\n📍 লোকেশন: ${errorStack}`,
        threadID,
        messageID
      );
    }
  }
};
