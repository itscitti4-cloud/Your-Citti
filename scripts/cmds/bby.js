const axios = require('axios');

const baseApiUrl = "https://nawab-api.onrender.com/api/bby";

module.exports.config = {
    name: "bby",
    aliases: ["baby", "citti", "bby"],
    version: "3.0.0",
    author: "Nawab",
    countDown: 0,
    role: 0,
    description: "Multi-functional Chat AI with teaching capabilities",
    category: "chat",
    guide: "{pn} [message] - Chat with AI\n{pn} teach [q1+q2] - [a1+a2] - Teach multi Q/A\n{pn} remove [ask] - [ans] - Delete data\n{pn} list/top/total - Statistics"
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;

    try {
        if (!args[0]) {
            const ran = ["Yes dear?", "I'm listening...", "Type 'help bby' for commands.", "Citti at your service!"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        // --- Multi-Teach Command ---
        if (args[0] === 'teach') {
            const content = dipto.replace("teach ", "");
            const [questionsRaw, answersRaw] = content.split(/\s*-\s*/);
            
            if (!questionsRaw || !answersRaw) {
                return api.sendMessage('❌ Invalid format! Use: teach q1+q2 - a1+a2', event.threadID, event.messageID);
            }

            const questions = questionsRaw.split(/\s*\+\s*/);
            const answers = answersRaw.split(/\s*\+\s*/);
            const teacherName = (await usersData.get(uid)).name;

            for (const q of questions) {
                for (const a of answers) {
                    await axios.get(`${baseApiUrl}/teach?ask=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}&teacher=${encodeURIComponent(teacherName)}`);
                }
            }

            // Fetch updated total for this teacher
            const listRes = await axios.get(`${baseApiUrl}/list`);
            const teacherStats = listRes.data.teachers.find(t => t.teacher_name === teacherName);
            const teacherTeachCount = teacherStats ? teacherStats.teach_count : "1";

            const successMsg = `╭───『 **SUCCESSFUL** 』───⟡\n` +
                               `│ 📝 **Questions:** ${questions.length}\n` +
                               `│ 📩 **Answers:** ${answers.length}\n` +
                               `│ 👤 **Teacher:** ${teacherName}\n` +
                               `│ 📊 **Your Total Teach:** ${teacherTeachCount}\n` +
                               `╰───────────────⟡`;
            return api.sendMessage(successMsg, event.threadID, event.messageID);
        }

        // --- Remove Command ---
        if (args[0] === 'remove') {
            const content = dipto.replace("remove ", "");
            const [ask, ans] = content.split(/\s*-\s*/);
            if (!ask || !ans) return api.sendMessage('❌ Use: remove question - answer', event.threadID, event.messageID);
            
            const res = await axios.get(`${baseApiUrl}/remove?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`);
            const status = res.data.status === "success" ? "✅ Successfully removed from database!" : "❌ Data not found!";
            return api.sendMessage(status, event.threadID, event.messageID);
        }

        // --- Stats Commands ---
        if (args[0] === 'list') {
            const res = await axios.get(`${baseApiUrl}/list`);
            const teachers = res.data.teachers.map((t, i) => `${i+1}. ${t.teacher_name} [${t.teach_count}]`).join('\n');
            return api.sendMessage(`📜 **Teacher Contributions:**\n${teachers}`, event.threadID, event.messageID);
        }

        if (args[0] === 'top') {
            const res = await axios.get(`${baseApiUrl}/top`);
            const top = res.data.top_10_teachers.map((t, i) => `🏆 ${i+1}. ${t.teacher_name} (${t.teach_count})`).join('\n');
            return api.sendMessage(`🌟 **Top 10 Contributors:**\n${top}`, event.threadID, event.messageID);
        }

        if (args[0] === 'total') {
            const res = await axios.get(`${baseApiUrl}/total`);
            return api.sendMessage(`📊 **Global Database:** ${res.data.total_commands} entries.`, event.threadID, event.messageID);
        }

        // --- Default Chat ---
        const chatRes = await axios.get(`${baseApiUrl}?text=${encodeURIComponent(dipto)}`);
        return api.sendMessage(chatRes.data.reply, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                author: event.senderID
            });
        }, event.messageID);

    } catch (e) {
        return api.sendMessage("⚠️ API is currently busy or offline.", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event }) => {
    try {
        const res = await axios.get(`${baseApiUrl}?text=${encodeURIComponent(event.body)}`);
        return api.sendMessage(res.data.reply, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                author: event.senderID
            });
        }, event.messageID);
    } catch (err) {
        return api.sendMessage("⚠️ Connection error.", event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.body) {
        const body = event.body.toLowerCase();
        const triggers = ["baby", "bby", "citti", "hinata", "@hinata", "বটলা", "বটু", "হিনাতা", "চিট্টি", "বেবি", "বেব", "বট", "bot", "botla", "botu"];
        const hasTrigger = triggers.some(t => body.startsWith(t));
        const hasPrefix = global.GoatBot.config.prefix && body.startsWith(global.GoatBot.config.prefix);

        if (hasTrigger && !hasPrefix) {
            const text = body.replace(/^\S+\s*/, "");
            if (!text) return api.sendMessage("Yes, I'm here! How can I help?", event.threadID, event.messageID);

            try {
                const res = await axios.get(`${baseApiUrl}?text=${encodeURIComponent(text)}`);
                return api.sendMessage(res.data.reply, event.threadID, (error, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        author: event.senderID
                    });
                }, event.messageID);
            } catch (err) { console.log(err); }
        }
    }
};
    
