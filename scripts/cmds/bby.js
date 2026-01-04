const axios = require('axios'); 

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const baseApiUrl = async () => {
    return "https://baby-apisx.vercel.app";
};

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "citti"],
    version: "1.1.7",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Simsimi Chatbot - Fixed Double Reply & Persistent Reply",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [msg] - [reply]\n{pn} qus rem [msg]\n{pn} ans rem [reply]"
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const input = args.join(" ");
    const uid = event.senderID;

    try {
        if (!args[0]) {
            const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "osta khabi🐸", "chup🤫", "🙋‍♀️🙎‍♀️"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        // --- Question Remove ---
        if (args[0] === 'qus' && args[1] === 'rem') {
            const qus = args.slice(2).join(" ");
            if (!qus) return api.sendMessage("❌ | ডিলিট করার প্রশ্ন লিখুন।", event.threadID, event.messageID);
            await axios.get(`${link}?remove=${encodeURIComponent(qus)}&db=${encodeURIComponent(mongoURI)}`);
            return api.sendMessage(`✅ প্রশ্ন: "${qus}" ডিলিট হয়েছে।`, event.threadID, event.messageID);
        }

        // --- Answer Remove ---
        if (args[0] === 'ans' && args[1] === 'rem') {
            const ans = args.slice(2).join(" ");
            if (!ans) return api.sendMessage("❌ | ডিলিট করার উত্তর লিখুন।", event.threadID, event.messageID);
            await axios.get(`${link}?remove_reply=${encodeURIComponent(ans)}&db=${encodeURIComponent(mongoURI)}`);
            return api.sendMessage(`✅ উত্তর: "${ans}" ডিলিট হয়েছে।`, event.threadID, event.messageID);
        }

        // --- Teach ---
        if (args[0] === 'teach') {
            const content = args.slice(1).join(" ");
            if (!content.includes('-')) return api.sendMessage('❌ | teach [Msg] - [Reply]', event.threadID, event.messageID);
            const [msg, rep] = content.split(/\s*-\s*/);
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg.trim())}&reply=${encodeURIComponent(rep.trim())}&senderID=${uid}&db=${encodeURIComponent(mongoURI)}`);
            let teacherName = "User";
            try { teacherName = await usersData.getName(uid); } catch (e) { teacherName = "Unknown"; }
            return api.sendMessage(`✅ Added: "${rep.trim()}"\nTeacher: ${teacherName}`, event.threadID, event.messageID);
        }

        // --- Start Conversation ---
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
        // রিপ্লাইতেও ডাটাবেস প্যারামিটার নিশ্চিত করা হয়েছে
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
    
    // শুধু রিপ্লাই ইভেন্ট হলে onChat বন্ধ থাকবে, onReply কাজ করবে
    if (event.type === "message_reply") return;

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
