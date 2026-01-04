const axios = require('axios'); 

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "citti"],
    version: "1.2.3",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Simsimi Chatbot - Optimized with English Error Messages",
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
    const link = "https://baby-apisx.vercel.app/baby";
    const uid = event.senderID;

    // --- Teach & Remove Logic (English Response) ---
    if (args[0] === 'teach' || args[0] === 'qus' || args[0] === 'ans') {
        try {
            if (args[0] === 'teach') {
                const content = args.slice(1).join(" ");
                if (!content.includes('-')) return api.sendMessage('❌ | Invalid Format! Use: teach [Question] - [Reply]', event.threadID, event.messageID);
                const [msg, rep] = content.split(/\s*-\s*/);
                await axios.get(`${link}?teach=${encodeURIComponent(msg.trim())}&reply=${encodeURIComponent(rep.trim())}&senderID=${uid}&db=${encodeURIComponent(mongoURI)}`);
                return api.sendMessage(`✅ Successfully Added!\nQuestion: ${msg.trim()}\nReply: ${rep.trim()}`, event.threadID, event.messageID);
            }
            
            if (args[0] === 'qus' && args[1] === 'rem') {
                const qus = args.slice(2).join(" ");
                if (!qus) return api.sendMessage("❌ | Please provide the question you want to remove.", event.threadID, event.messageID);
                await axios.get(`${link}?remove=${encodeURIComponent(qus)}&db=${encodeURIComponent(mongoURI)}`);
                return api.sendMessage(`✅ The question "${qus}" has been removed from the database.`, event.threadID, event.messageID);
            }

            if (args[0] === 'ans' && args[1] === 'rem') {
                const ans = args.slice(2).join(" ");
                if (!ans) return api.sendMessage("❌ | Please provide the answer you want to remove.", event.threadID, event.messageID);
                await axios.get(`${link}?remove_reply=${encodeURIComponent(ans)}&db=${encodeURIComponent(mongoURI)}`);
                return api.sendMessage(`✅ The reply "${ans}" has been removed from the database.`, event.threadID, event.messageID);
            }
        } catch (e) { 
            return api.sendMessage("❌ Server Error! Please try again later.", event.threadID, event.messageID); 
        }
    }

    const input = args.join(" ");
    if (!input) {
        const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "atw dakos kn! usta khabi?🐸", "chup🤫"];
        return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
    }

    const reply = await getReply(input, uid);
    if (reply) {
        return api.sendMessage(reply, event.threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: uid });
        }, event.messageID);
    } else {
        return api.sendMessage("❌ I don't know the answer. Can you teach me?", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (Reply.commandName !== this.config.name || event.senderID == api.getCurrentUserID()) return;
    
    const reply = await getReply(event.body, event.senderID);
    if (reply) {
        return api.sendMessage(reply, event.threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
        }, event.messageID);
    }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body || event.messageReply) return;

    const body = event.body.toLowerCase();
    const triggers = ["bby", "baby", "citti", "hinata", "হিনাতা", "চিট্টি", "বেবি", "বট", "bot"];
    const matchedTrigger = triggers.find(trigger => body.startsWith(trigger));

    if (matchedTrigger) {
        let text = event.body.slice(matchedTrigger.length).trim();
        
        if (!text) {
            const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "atw dakos kn! usta khabi?🐸", "chup🤫", "বলো জানু, শুনছি! 😚"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        const reply = await getReply(text, event.senderID);
        if (reply) {
            return api.sendMessage(reply, event.threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            }, event.messageID);
        }
    }
};
    
