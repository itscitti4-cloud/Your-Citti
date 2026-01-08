const axios = require('axios');
const baseApiUrl = "https://nawab-api.onrender.com/api/bby";

// অনুমোদিত গ্রুপ আইডির তালিকা
const allowedThreads = ["2593974107646263", "25416434654648555"];

module.exports.config = {
    name: "citti",
    aliases: ["baby", "hinata", "bby"],
    version: "3.4.0", 
    author: "Nawab",
    countDown: 0,
    role: 0,
    description: "Multi-functional Chat AI with Admin Restrictions",
    category: "chat",
    guide: "{pn} [message] - Chat with AI\n{pn} teach [q1+q2] - [a1+a2] - Teach multi Q/A\n{pn} remove [ask] - [ans] - Delete data\n{pn} list/top/total - Statistics"
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;
    const userData = await usersData.get(uid);
    
    // --- Special ID Logic ---
    let displayName = userData.name;
    if (uid === "61585634146171") displayName = "Sir";
    if (uid === "61583939430347") displayName = "Ma'am";

    try {
        if (!args[0]) {
            const ran = [
                `Yes ${displayName}, I'm here!`,
                `${displayName}, Ki hoiche`,
                `Ki somossa ${displayName}`,
                `${displayName}, Ki hoiche re Dakos kn?`,
                `${displayName}, Atw jalas kn amare`,
                `${displayName} ato dakle Pabna Pathamu tore`,
                `${displayName} tor jalay r baci na, group theke left nimu khara, jai hok bol ki hoiche`,
                `Yes dear ${displayName}, I'm listening...`, 
                `Bolo ${displayName}, ki bolte chao?`, 
                `I'm Your Citti, at your service, ${displayName}!`
            ];
            const randomMsg = ran[Math.floor(Math.random() * ran.length)];
            
            return api.sendMessage(randomMsg, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: event.senderID
                });
            }, event.messageID);
        }

        // --- Multi-Teach Command (Thread Restricted) ---
        if (args[0] === 'teach') {
            if (!allowedThreads.includes(event.threadID)) {
                return api.sendMessage(`⚠️ Access Restrictions! This group doesn't have permission to teach me.\n\nYou can teach me on our official groups. To join our support group, type: {p}supportgc`, event.threadID, event.messageID);
            }

            const content = dipto.replace("teach ", "");
            const [questionsRaw, answersRaw] = content.split(/\s*-\s*/);
            
            if (!questionsRaw || !answersRaw) {
                return api.sendMessage('❌ Invalid format! Use: teach q1+q2 - a1+a2', event.threadID, event.messageID);
            }

            const questions = questionsRaw.split(/\s*\+\s*/);
            const answers = answersRaw.split(/\s*\+\s*/);
            const teacherName = userData.name;

            for (const q of questions) {
                for (const a of answers) {
                    await axios.get(`${baseApiUrl}/teach?ask=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}&teacher=${encodeURIComponent(teacherName)}`);
                }
            }

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

        // --- Remove Command (Thread Restricted) ---
        if (args[0] === 'remove') {
            if (!allowedThreads.includes(event.threadID)) {
                return api.sendMessage(`⚠️ Access Restrictions! This group doesn't have permission to modify my database.\n\nYou can contact admin or use our support group. Type: {p}supportgc`, event.threadID, event.messageID);
            }

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

module.exports.onChat = async ({ api, event, usersData }) => {
    if (event.body) {
        const body = event.body.toLowerCase();
        const triggers = ["baby", "bby", "citti", "hinata", "@hinata", "বটলা", "বটু", "হিনাতা", "চিট্টি", "বেবি", "বেব", "বট", "bot", "botla", "botu"];
        const hasTrigger = triggers.some(t => body.startsWith(t));
        const hasPrefix = global.GoatBot.config.prefix && body.startsWith(global.GoatBot.config.prefix);

        if (hasTrigger && !hasPrefix) {
            const text = body.replace(/^\S+\s*/, "");
            const uid = event.senderID;
            const userData = await usersData.get(uid);
            
            // --- Special ID Logic ---
            let displayName = userData.name;
            if (uid === "61585634146171") displayName = "Sir";
            if (uid === "61583939430347") displayName = "Ma'am";
            
            if (!text) {
                const greetings = [
                    `Yes ${displayName}, bolo ki bolbe?`,
                    `Hi ${displayName}, I'm here!`,
                    `Ji ${displayName}, amake daktacho?`,
                    `Yes dear ${displayName}, how can I help?`
                ];
                const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

                return api.sendMessage(randomGreeting, event.threadID, (error, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        author: event.senderID
                    });
                }, event.messageID);
            }

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
        
