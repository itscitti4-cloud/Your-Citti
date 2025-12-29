const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "install",
        version: "1.1.0",
        author: "AkHi",
        countDown: 5,
        role: 2, 
        category: "system",
        shortDescription: {
            en: "Installs a command from a raw URL or direct code."
        },
        guide: {
            en: "{p}install [fileName] [rawUrl/code]\nExample 1: {p}install hello https://raw.github.com/...\nExample 2: {p}install hello module.exports = { ... }"
        }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;

        // 1. Input Check
        if (args.length < 2) {
            return api.sendMessage("❌ Invalid Format!\n\n1. Via URL: {p}install [fileName] [URL]\n2. Via Code: {p}install [fileName] [code]", threadID, messageID);
        }

        const fileName = args[0].replace(".js", "").toLowerCase();
        const inputData = args.slice(1).join(" ");
        const filePath = path.join(__dirname, `${fileName}.js`);
        let code = "";

        try {
            api.sendMessage(`⏳ AkHi Ma'am, starting installation for '${fileName}.js'... please wait.`, threadID, messageID);

            // 2. Data Check (URL or Direct Code)
            if (inputData.startsWith("http")) {
                const response = await axios.get(inputData);
                code = response.data;
            } else {
                code = inputData;
            }

            // 3. Code Validation
            if (typeof code !== "string" || !code.includes("config") || !code.includes("module.exports")) {
                return api.sendMessage("❌ Error: The provided code is not in the correct GoatBot command format. Make sure it includes 'config' and 'module.exports'.", threadID, messageID);
            }

            // 4. Save the file
            fs.writeFileSync(filePath, code, "utf8");

            return api.sendMessage(
                `✅ Installation successful!\n📂 File name: ${fileName}.js\n⚠️ Please restart the bot to activate the new command.`, 
                threadID, 
                messageID
            );

        } catch (error) {
            console.error(error);
            return api.sendMessage(`⚠️ Installation failed.\nError: ${error.message}`, threadID, messageID);
        }
    }
};
