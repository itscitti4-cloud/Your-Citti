const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "install",
        version: "1.0.0",
        author: "AkHi",
        countDown: 5,
        role: 2, // শুধুমাত্র বট এডমিনদের জন্য
        category: "system",
        shortDescription: {
            en: "Installs a command from a raw URL."
        },
        guide: {
            en: "{p}install [fileName] [rawUrl]\nExample: {p}install hello https://raw.github.com/.../hello.js"
        }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;

        // ১. ইনপুট চেক
        if (args.length < 2) {
            return api.sendMessage("❌ সঠিক ফরম্যাট ব্যবহার করুন!\nব্যবহার: {p}install [ফাইলের নাম] [Raw URL]", threadID, messageID);
        }

        const fileName = args[0].replace(".js", "").toLowerCase();
        const rawUrl = args[1];
        const filePath = path.join(__dirname, `${fileName}.js`);

        try {
            api.sendMessage(`⏳ AkHi Ma'am, '${fileName}.js' ইনস্টল করার চেষ্টা করছি, দয়া করে অপেক্ষা করুন...`, threadID, messageID);

            // ২. ইউআরএল থেকে কোড ডাউনলোড করা
            const response = await axios.get(rawUrl);
            const code = response.data;

            if (typeof code !== "string" || !code.includes("config") || !code.includes("module.exports")) {
                return api.sendMessage("❌ ডাউনলোড করা কোডটি সঠিক GoatBot কমান্ড ফরম্যাটে নেই।", threadID, messageID);
            }

            // ৩. ফাইলটি সেভ করা
            fs.writeFileSync(filePath, code, "utf8");

            return api.sendMessage(
                `✅ ইনস্টলেশন সফল!\n📂 ফাইলটির নাম: ${fileName}.js\n⚠️ নতুন কমান্ডটি একটিভ করতে বটটি রিস্টার্ট (restart) দিন।`, 
                threadID, 
                messageID
            );

        } catch (error) {
            console.error(error);
            return api.sendMessage(`⚠️ ইনস্টল করতে সমস্যা হয়েছে।\nএরর: ${error.message}`, threadID, messageID);
        }
    }
};
