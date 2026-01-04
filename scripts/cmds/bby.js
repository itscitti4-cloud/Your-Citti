const axios = require('axios'); 

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const baseApiUrl = async () => {
    return "https://baby-apisx.vercel.app";
};

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "citti"],
    version: "1.1.8",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Simsimi Chatbot - Final Fix for Reply & Double Messages",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [msg] - [reply]\n{pn} qus rem [msg]\n{pn} ans rem [reply]"
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const input = args.join(" ");
    const uid = event.senderID;

    try {
        if (!args[0]) {
            const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "atw dakos kn! usta khabi?🐸", "chup🤫", "🙋‍♀️🙎‍♀️"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        // --- Question/Answer Remove and Teach logic remains same ---
        if (args[0] === 'qus' || args[0] === 'ans' || args[0] === 'teach') {
             // ... [Rest of your teach/remove code]
        }

        const res = await axios.get(`${link}?text=${encodeURIComponent(input)}&senderID=${uid}&db=${encodeURIComponent(mongoURI)}&font=1`);
        return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
            if (info) {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: uid });
            }
        }, event.messageID);

    } catch (e) {
        return api.sendMessage("❌ Api error!", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (Reply.commandName !== this.config.name || event.senderID == api.getCurrentUserID()) return;
    
    try {
        const baseUrl = await baseApiUrl();
        const res = await axios.get(`${baseUrl}/baby?text=${encodeURIComponent(event.body)}&senderID=${event.senderID}&db=${encodeURIComponent(mongoURI)}`);
        return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
            if (info) {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            }
        }, event.messageID);
    } catch (err) { console.error("Reply Error:", err); }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;
    
    // ফিক্স: শুধুমাত্র তখনই থামবে যদি রিপ্লাইটি এই নির্দিষ্ট কমান্ডের (bby) কোনো মেসেজের ওপর হয়
    // যাতে onReply নিজের কাজ করতে পারে।
    if (event.messageReply && global.GoatBot.onReply.has(event.messageReply.messageID)) return;

    const body = event.body;
    const triggers = ["bby", "baby", "citti", "hinata", "হিনাতা", "চিট্টি", "বেবি", "বট", "bot"];
    const matchedTrigger = triggers.find(trigger => body.toLowerCase().startsWith(trigger));

    if (matchedTrigger) {
        const text = body.slice(matchedTrigger.length).trim();
        if (!text) return api.sendMessage("বলো জানু, শুনছি! 😚", event.threadID, event.messageID);

        try {
            const baseUrl = await baseApiUrl();
            const res = await axios.get(`${baseUrl}/baby?text=${encodeURIComponent(text)}&senderID=${event.senderID}&db=${encodeURIComponent(mongoURI)}`);
            return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
                if (info) {
                    global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
                }
            }, event.messageID);
        } catch (err) { console.error("onChat Error:", err); }
    }
};
