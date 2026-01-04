const axios = require('axios'); 

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "citti"],
    version: "1.2.6",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Fixed logic for continuous conversation",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [msg] - [reply]\n{pn} qus rem [msg]\n{pn} ans rem [reply]"
};

async function getReply(text, senderID) {
    try {
        const link = "https://baby-apisx.vercel.app/baby";
        const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderID=${senderID}&db=${encodeURIComponent(mongoURI)}&font=1`);
        return res.data.reply;
    } catch (err) {
        return null;
    }
}

module.exports.onStart = async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const input = args.join(" ");

    // Teach/Remove logic
    if (args[0] === 'teach' || args[0] === 'qus' || args[0] === 'ans') {
        const link = "https://baby-apisx.vercel.app/baby";
        try {
            if (args[0] === 'teach') {
                const content = args.slice(1).join(" ");
                if (!content.includes('-')) return api.sendMessage('❌ | Format: teach [Q] - [A]', threadID, messageID);
                const [msg, rep] = content.split(/\s*-\s*/);
                await axios.get(`${link}?teach=${encodeURIComponent(msg.trim())}&reply=${encodeURIComponent(rep.trim())}&senderID=${senderID}&db=${encodeURIComponent(mongoURI)}`);
                return api.sendMessage(`✅ Added!\nQ: ${msg.trim()}\nA: ${rep.trim()}`, threadID, messageID);
            }
        } catch (e) { return api.sendMessage("❌ Error connecting to server.", threadID, messageID); }
    }

    if (!input) {
        const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "বলো জানু, শুনছি! 😚"];
        return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
        }, messageID);
    }

    const reply = await getReply(input, senderID);
    if (reply) {
        return api.sendMessage(reply, threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
        }, messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (Reply.commandName !== this.config.name) return;
    
    // এপিআই থেকে সরাসরি রিপ্লাই আনা হচ্ছে
    const reply = await getReply(event.body, event.senderID);
    if (reply) {
        return api.sendMessage(reply, event.threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
        }, event.messageID);
    }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;

    // যদি এটি অলরেডি একটি রিপ্লাই হয়, তবে onReply হ্যান্ডেল করবে, onChat নয়।
    if (event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) return;

    const body = event.body.toLowerCase();
    const triggers = ["bby", "baby", "citti", "bot", "বেবি", "বট"];
    const matchedTrigger = triggers.find(t => body.startsWith(t));

    if (matchedTrigger) {
        let text = event.body.slice(matchedTrigger.length).trim();
        
        if (!text) {
            const ran = ["জি জানু, বলো!", "হুম শুনছি...", "বলো জানু, শুনছি! 😚"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            }, event.messageID);
        }

        const reply = await getReply(text, event.senderID);
        if (reply) {
            return api.sendMessage(reply, event.threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            }, event.messageID);
        }
    }
};
