const axios = require('axios');

// আপনার MongoDB URL টি এখানে রেফারেন্স হিসেবে রাখা হলো, তবে এটি এপিআই এন্ডপয়েন্টে সেভ হওয়াই শ্রেয়।
const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const baseApiUrl = async () => {
    return "https://baby-apisx.vercel.app";
};

module.exports.config = {
    name: "akhi",
    aliases: ["bby", "baby"],
    version: "1.0.2",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Simsimi Chatbot with MongoDB Support & Custom Reply Format",
    category: "chat",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply] OR\nremove [YourMessage] OR\nlist OR all"
    }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const input = args.join(" ").toLowerCase();
    const uid = event.senderID;

    try {
        if (!args[0]) {
            const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "type !akhi help"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        // --- Teach Function with Specific Reply Format ---
        if (args[0] === 'teach') {
            const content = args.slice(1).join(" ");
            if (!content.includes('-')) {
                return api.sendMessage('❌ | ফরম্যাট: teach [Message] - [Reply]', event.threadID, event.messageID);
            }

            const [msg, rep] = content.split(/\s*-\s*/);
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg.trim())}&reply=${encodeURIComponent(rep.trim())}&senderID=${uid}&db=${encodeURIComponent(mongoURI)}`);
            
            let teacherName = "User";
            try {
                teacherName = await usersData.getName(uid);
            } catch (e) { teacherName = "Unknown"; }

            // আপনার চাওয়া নির্দিষ্ট ফরম্যাট:
            const replyMsg = `✅ Replies added Replies "${rep.trim()}" added to "${msg.trim()}".\nTeacher: ${teacherName}\nTeachs: ${res.data.teachs || "1"}`;
            
            return api.sendMessage(replyMsg, event.threadID, event.messageID);
        }

        // --- List Function ---
        if (args[0] === 'list') {
            const res = await axios.get(`${link}?list=all`);
            return api.sendMessage(`❇️ Total Teach = ${res.data.length || 0}\n👑 List of Teachers of Akhi`, event.threadID, event.messageID);
        }

        // --- Default Chat ---
        const res = await axios.get(`${link}?text=${encodeURIComponent(input)}&senderID=${uid}&font=1`);
        return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
            if (info) {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: uid
                });
            }
        }, event.messageID);

    } catch (e) {
        return api.sendMessage("⚠️ এপিআই সার্ভারে সমস্যা হচ্ছে।", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID()) return;
    try {
        const res = await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body)}&senderID=${event.senderID}`);
        return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, { commandName: "akhi", author: event.senderID });
        }, event.messageID);
    } catch (err) { console.error(err); }
};

module.exports.onChat = async ({ api, event }) => {
    const body = event.body ? event.body.toLowerCase() : "";
    const triggers = ["bby", "baby", "jan", "babu", "janu"];
    
    if (triggers.some(trigger => body.startsWith(trigger))) {
        const text = body.replace(/^(bby|baby|jan|babu|janu)\s*/, "").trim();
        if (!text) return api.sendMessage("বলো জানু, শুনছি! 😚", event.threadID, event.messageID);

        try {
            const res = await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(text)}&senderID=${event.senderID}`);
            return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
                global.GoatBot.onReply.set(info.messageID, { commandName: "akhi", author: event.senderID });
            }, event.messageID);
        } catch (err) { console.error(err); }
    }
};
