const axios = require('axios'); 

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const baseApiUrl = async () => {
    return "https://baby-apisx.vercel.app";
};

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "bby"],
    version: "1.0.8",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Simsimi Chatbot with Mention/Reply Auto-Detection",
    category: "chat",
    guide: "{pn} [message] or teach [msg] - [reply]"
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const input = args.join(" ").toLowerCase();
    const uid = event.senderID;

    try {
        if (!args[0]) {
            const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "kisse tor😾", "akta usta marmu cup kor😾", "biye koros nay bby paili koi😕", "usta khabi🐸", "chup🤫", "keda tumi abar🫩", "tui kon hori das pal🤨", "🫡", "🙋‍♀️🙎‍♀️"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        if (args[0] === 'teach') {
            const content = args.slice(1).join(" ");
            if (!content.includes('-')) {
                return api.sendMessage('❌ | Format: teach [Message] - [Reply]', event.threadID, event.messageID);
            }

            const [msg, rep] = content.split(/\s*-\s*/);
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg.trim())}&reply=${encodeURIComponent(rep.trim())}&senderID=${uid}&db=${encodeURIComponent(mongoURI)}`);
            
            let teacherName = "User";
            try {
                teacherName = await usersData.getName(uid);
            } catch (e) { teacherName = "Unknown"; }

            const replyMsg = `✅ Replies added "${rep.trim()}" to "${msg.trim()}".\nTeacher: ${teacherName}\nTotal Teachs: ${res.data.teachs || "1"}`;
            return api.sendMessage(replyMsg, event.threadID, event.messageID);
        }

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
        return api.sendMessage("❌ Api server error!", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (Reply.commandName !== this.config.name) return;
    if (event.senderID == api.getCurrentUserID()) return;
    
    try {
        const baseUrl = await baseApiUrl();
        const res = await axios.get(`${baseUrl}/baby?text=${encodeURIComponent(event.body)}&senderID=${event.senderID}`);
        
        return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
            if (info) {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: event.senderID
                });
            }
        }, event.messageID);
    } catch (err) {
        console.error("Reply Error:", err);
    }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;
    
    const body = event.body.toLowerCase();
    const triggers = ["bby", "baby", "citti", "hinata", "@hi na ta", "হিনাতা", "চিট্টি", "বেবি", "বট", "বটলা", "bot", "botla"];
    
    // চেক করা মেসেজে কোনো ট্রিগার আছে কি না
    const matchedTrigger = triggers.find(trigger => body.startsWith(trigger));
    
    // চেক করা মেসেজটি বটের কোনো মেসেজের রিপ্লাই কি না
    const isReplyToBot = event.messageReply && event.messageReply.senderID == api.getCurrentUserID();

    // ট্রিগার থাকলে অথবা সরাসরি বটের মেসেজে রিপ্লাই দিলে রেসপন্স করবে
    if (matchedTrigger || isReplyToBot) {
        let text = event.body;
        if (matchedTrigger) {
            text = body.replace(matchedTrigger, "").trim();
        }
        
        if (!text && matchedTrigger) {
            return api.sendMessage("বলো জানু, শুনছি! 😚", event.threadID, event.messageID);
        }
        if (!text) return;

        try {
            const baseUrl = await baseApiUrl();
            const res = await axios.get(`${baseUrl}/baby?text=${encodeURIComponent(text)}&senderID=${event.senderID}`);
            return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
                if (info) {
                    global.GoatBot.onReply.set(info.messageID, { 
                        commandName: this.config.name, 
                        author: event.senderID 
                    });
                }
            }, event.messageID);
        } catch (err) { console.error("onChat Error:", err); }
    }
};
