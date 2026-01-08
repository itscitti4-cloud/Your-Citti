const axios = require('axios');

const baseApiUrl = "https://nawab-api.onrender.com/api/bby";

module.exports.config = {
    name: "bby",
    aliases: ["baby", "citti", "bby"],
    version: "2.0.0",
    author: "Nawab",
    countDown: 0,
    role: 0,
    description: "Chat with Citti AI (like simisim)",
    category: "chat",
    guide: "{pn} [message] - To talk\n{pn} teach [ask] - [ans] - To teach\n{pn} remove [ask] - [ans] - To remove\n{pn} list - To see teachers\n{pn} top - To see top teachers\n{pn} total - Total data count"
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;

    try {
        if (!args[0]) {
            const ran = ["Bolo baby", "Hum bolo?", "Type help bby", "Citti is here!"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        // --- Teach Command ---
        if (args[0] === 'teach') {
            const content = dipto.replace("teach ", "");
            const [ask, ans] = content.split(/\s*-\s*/);
            if (!ask || !ans) return api.sendMessage('❌ Invalid format! Use: teach hi - hello', event.threadID, event.messageID);
            
            const teacherName = (await usersData.get(uid)).name;
            const res = await axios.get(`${baseApiUrl}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&teacher=${encodeURIComponent(teacherName)}`);
            return api.sendMessage(`✅ Added! \nAsk: ${ask}\nAns: ${ans}\nTeacher: ${teacherName}`, event.threadID, event.messageID);
        }

        // --- Remove Command ---
        if (args[0] === 'remove') {
            const content = dipto.replace("remove ", "");
            const [ask, ans] = content.split(/\s*-\s*/);
            const res = await axios.get(`${baseApiUrl}/remove?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`);
            return api.sendMessage(res.data.message, event.threadID, event.messageID);
        }

        // --- List & Top ---
        if (args[0] === 'list') {
            const res = await axios.get(`${baseApiUrl}/list`);
            const teachers = res.data.teachers.map(t => `• ${t.teacher_name}: ${t.teach_count}`).join('\n');
            return api.sendMessage(`👑 Teacher List:\n${teachers}`, event.threadID, event.messageID);
        }

        if (args[0] === 'top') {
            const res = await axios.get(`${baseApiUrl}/top`);
            const top = res.data.top_10_teachers.map((t, i) => `${i+1}. ${t.teacher_name}: ${t.teach_count}`).join('\n');
            return api.sendMessage(`🏆 Top 10 Teachers:\n${top}`, event.threadID, event.messageID);
        }

        if (args[0] === 'total') {
            const res = await axios.get(`${baseApiUrl}/total`);
            return api.sendMessage(`📊 Total Database Count: ${res.data.total_commands}`, event.threadID, event.messageID);
        }

        // --- Default Chat ---
        const res = await axios.get(`${baseApiUrl}?text=${encodeURIComponent(dipto)}`);
        const reply = res.data.reply;
        
        return api.sendMessage(reply, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                author: event.senderID
            });
        }, event.messageID);

    } catch (e) {
        return api.sendMessage("API Error or Server Down!", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    try {
        const res = await axios.get(`${baseApiUrl}?text=${encodeURIComponent(event.body)}`);
        return api.sendMessage(res.data.reply, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                author: event.senderID
            });
        }, event.messageID);
    } catch (err) {
        return api.sendMessage("Error connection!", event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.body) {
        const body = event.body.toLowerCase();
        const triggers = ["baby", "bby", "citti", "hinata", "@hinata", "বটলা", "বটু", "হিনাতা", "চিট্টি", "বেবি", "বেব", "বট", "bot", "botla", "botu"];
        
        // চেক করবে মেসেজ ট্রিগার দিয়ে শুরু কি না এবং প্রিপিক্স আছে কি না
        const hasTrigger = triggers.some(t => body.startsWith(t));
        const hasPrefix = global.GoatBot.config.prefix && body.startsWith(global.GoatBot.config.prefix);

        if (hasTrigger && !hasPrefix) {
            const text = body.replace(/^\S+\s*/, "");
            if (!text) return api.sendMessage("Bolo jaan?", event.threadID, event.messageID);

            try {
                const res = await axios.get(`${baseApiUrl}?text=${encodeURIComponent(text)}`);
                return api.sendMessage(res.data.reply, event.threadID, (error, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        author: event.senderID
                    });
                }, event.messageID);
            } catch (err) {
                console.log(err);
            }
        }
    }
};
