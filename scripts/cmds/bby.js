const axios = require('axios');
const baseApiUrl = "https://nawab-api-i2z3.onrender.com/api/bby";

// অনুমোদিত গ্রুপ আইডির তালিকা
const allowedThreads = ["2593974107646263", "25416434654648555"];

// র্যান্ডম ইমোজি ফাংশন
function getEmoji() {
    const emojis = ["😊", "😇", "😻", "✨", "🌸", "🧸", "🐥", "💫", "🍃", "🙃"];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// টেক্সট ক্লিন করার ফাংশন
function cleanText(text) {
    if (!text) return "";
    return text.replace(/[^\w\s\u0980-\u09FF]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

module.exports.config = {
    name: "citti",
    aliases: ["baby", "hinata", "bby"],
    version: "3.5.2", 
    author: "Nawab",
    countDown: 0,
    role: 0,
    description: "Multi-functional Chat",
    category: "chat",
    guide: "{pn} [message] - Chat with AI\n{pn} teach [q1+q2] - [a1+a2] - Teach multi Q/A\n{pn} remove [ask] - [ans] - Delete data\n{pn} list/top/total - Statistics"
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const dipto = args.join(" ").toLowerCase();
    const cleanedDipto = cleanText(dipto);
    const uid = event.senderID;
    const userData = await usersData.get(uid);
    
    let displayName = userData?.name || "User";
    if (uid === "61585634146171") displayName = "Sir";
    else if (uid === "61583939430347") displayName = "Ma'am";

    try {
        if (!args[0]) {
            const ran = [
                `Yes ${displayName}, I'm here! ${getEmoji()}`,
                `${displayName}, Ki hoiche ${getEmoji()}`,
                `Ki somossa ${displayName} ${getEmoji()}`,
                `Yes dear ${displayName}, I'm listening... ${getEmoji()}`, 
                `Bolo ${displayName}, ki bolte chao? ${getEmoji()}`
            ];
            const randomMsg = ran[Math.floor(Math.random() * ran.length)];
            
            return api.sendMessage(randomMsg, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: event.senderID
                });
            }, event.messageID);
        }

        if (args[0] === 'teach') {
            if (!allowedThreads.includes(event.threadID)) {
                return api.sendMessage(`⚠️ Access Restrictions! This group doesn't have permission to teach me. ${getEmoji()}`, event.threadID, event.messageID);
            }
            const content = dipto.replace("teach ", "");
            const [questionsRaw, answersRaw] = content.split(/\s*-\s*/);
            if (!questionsRaw || !answersRaw) return api.sendMessage('❌ Invalid format! Use: teach q1+q2 - a1+a2', event.threadID, event.messageID);

            const questions = questionsRaw.split(/\s*\+\s*/);
            const answers = answersRaw.split(/\s*\+\s*/);
            const teacherName = userData?.name || "Unknown";

            for (const q of questions) {
                const qClean = cleanText(q);
                for (const a of answers) {
                    await axios.get(`${baseApiUrl}/teach`, {
                        params: { ask: qClean, ans: a.trim(), teacher: teacherName },
                        timeout: 20000 
                    });
                }
            }

            let teacherTeachCount = "1";
            try {
                const listRes = await axios.get(`${baseApiUrl}/list`, { timeout: 10000 });
                const teacherStats = listRes.data.teachers.find(t => t.teacher_name === teacherName);
                teacherTeachCount = teacherStats ? teacherStats.teach_count : "1";
            } catch (err) { console.log("Stats error"); }

            const successMsg = `╭───『 **SUCCESSFUL** 』───⟡\n│ 📝 **Questions:** ${questions.length}\n│ 📩 **Answers:** ${answers.length}\n│ 👤 **Teacher:** ${teacherName}\n│ 📊 **Your Total Teach:** ${teacherTeachCount}\n╰───────────────⟡ ${getEmoji()}`;
            return api.sendMessage(successMsg, event.threadID, event.messageID);
        }

        if (args[0] === 'remove') {
            if (!allowedThreads.includes(event.threadID)) return api.sendMessage(`⚠️ Access Restrictions! ${getEmoji()}`, event.threadID, event.messageID);
            const content = dipto.replace("remove ", "");
            const [ask, ans] = content.split(/\s*-\s*/);
            const res = await axios.get(`${baseApiUrl}/remove`, { params: { ask: cleanText(ask), ans: ans.trim() }, timeout: 15000 });
            return api.sendMessage(res.data.status === "success" ? `✅ Removed! ${getEmoji()}` : `❌ Not found! ${getEmoji()}`, event.threadID, event.messageID);
        }

        if (args[0] === 'list' || args[0] === 'top' || args[0] === 'total') {
            const res = await axios.get(`${baseApiUrl}/${args[0]}`, { timeout: 15000 });
            let msg = "";
            if (args[0] === 'list') msg = `📜 **Teacher Contributions:**\n` + res.data.teachers.map((t, i) => `${i+1}. ${t.teacher_name} [${t.teach_count}]`).join('\n');
            if (args[0] === 'top') msg = `🌟 **Top 10 Contributors:**\n` + res.data.top_10_teachers.map((t, i) => `🏆 ${i+1}. ${t.teacher_name} (${t.teach_count})`).join('\n');
            if (args[0] === 'total') msg = `📊 **Global Database:** ${res.data.total_commands} entries.`;
            return api.sendMessage(`${msg} ${getEmoji()}`, event.threadID, event.messageID);
        }

        const chatRes = await axios.get(`${baseApiUrl}`, {
            params: { text: cleanedDipto },
            timeout: 20000 
        });

        if (chatRes.data && chatRes.data.reply) {
            return api.sendMessage(`${chatRes.data.reply} ${getEmoji()}`, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            }, event.messageID);
        } else {
            throw new Error("Empty Response");
        }

    } catch (e) {
        console.error("API Error:", e.message);
        return api.sendMessage(`⚠️ Database bitore ekkhon ektu jhamela hocche, abr try koro dear ${displayName}! ${getEmoji()}`, event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    // Reply অবজেক্ট ব্যবহার করে নিশ্চিত করা হয়েছে যে এটি এই কমান্ডেরই রিপ্লাই
    try {
        const cleanedReply = cleanText(event.body);
        if (!cleanedReply) return;

        const res = await axios.get(`${baseApiUrl}`, { params: { text: cleanedReply }, timeout: 20000 });
        if (res.data && res.data.reply) {
            return api.sendMessage(`${res.data.reply} ${getEmoji()}`, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, { 
                    commandName: this.config.name, 
                    author: event.senderID 
                });
            }, event.messageID);
        }
    } catch (err) {
        console.error("Reply Error:", err.message);
        return api.sendMessage(`⚠️ Connection ektu slow, abar reply dao! ${getEmoji()}`, event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event, usersData }) => {
    if (event.body) {
        const body = event.body.toLowerCase();
        const triggers = ["baby", "bby", "citti", "hinata", "বট", "বেবি", "বটু", "বটলা", "হিনাতা", "চিট্টি", "bot", "botla", "botu", "@HI NA TA"];
        const hasTrigger = triggers.some(t => body.startsWith(t));
        const hasPrefix = global.GoatBot.config.prefix && body.startsWith(global.GoatBot.config.prefix);

        if (hasTrigger && !hasPrefix) {
            // ট্রিগার শব্দটা বাদ দিয়ে মেইন টেক্সট বের করা
            const triggerUsed = triggers.find(t => body.startsWith(t));
            const rawText = body.slice(triggerUsed.length).trim();
            const cleanedText = cleanText(rawText);
            
            const uid = event.senderID;
            const userData = await usersData.get(uid);
            let displayName = userData?.name || "User";
            if (uid === "61585634146171") displayName = "Sir";
            else if (uid === "61583939430347") displayName = "Ma'am";
            
            if (!cleanedText) return api.sendMessage(`Yes ${displayName}, bolo ki bolbe? ${getEmoji()}`, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            });

            try {
                const res = await axios.get(`${baseApiUrl}`, { params: { text: cleanedText }, timeout: 20000 });
                if (res.data && res.data.reply) {
                    return api.sendMessage(`${res.data.reply} ${getEmoji()}`, event.threadID, (error, info) => {
                        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
                    }, event.messageID);
                }
            } catch (err) { console.log("onChat Busy"); }
        }
    }
};
                                 
