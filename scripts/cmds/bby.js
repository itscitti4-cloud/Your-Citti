const axios = require('axios');
const baseApiUrl = "https://nawab-api.onrender.com/api/bby";

// অনুমোদিত গ্রুপ আইডির তালিকা
const allowedThreads = ["2593974107646263", "25416434654648555"];

// র্যান্ডম ইমোজি ফাংশন (বটের কথার শেষে যুক্ত হবে)
function getEmoji() {
    const emojis = ["😊", "😇", "😻", "✨", "🌸", "🧸", "🐥", "💫", "🍃", "🙃"];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// টেক্সট ক্লিন করার ফাংশন (ইমোজি এবং সিম্বল সরাবে)
function cleanText(text) {
    if (!text) return "";
    // ইমোজি এবং পাঙ্কচুয়েশন সরাবে, শুধু অক্ষর এবং স্পেস রাখবে
    return text.replace(/[^\w\s\u0980-\u09FF]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

module.exports.config = {
    name: "citti",
    aliases: ["baby", "hinata", "bby"],
    version: "3.5.0", 
    author: "Nawab",
    countDown: 0,
    role: 0,
    description: "Multi-functional Chat AI with Symbol/Emoji Cleaner",
    category: "chat",
    guide: "{pn} [message] - Chat with AI\n{pn} teach [q1+q2] - [a1+a2] - Teach multi Q/A\n{pn} remove [ask] - [ans] - Delete data\n{pn} list/top/total - Statistics"
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const dipto = args.join(" ").toLowerCase();
    const cleanedDipto = cleanText(dipto); // প্রশ্ন ক্লিন করা হলো
    const uid = event.senderID;
    const userData = await usersData.get(uid);
    
    let displayName = userData.name;
    if (uid === "61585634146171") displayName = "Sir";
    if (uid === "61583939430347") displayName = "Ma'am";

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

        // --- Multi-Teach Command ---
        if (args[0] === 'teach') {
            if (!allowedThreads.includes(event.threadID)) {
                return api.sendMessage(`⚠️ Access Restrictions! This group doesn't have permission to teach me.\n\nYou can teach me on our official groups. ${getEmoji()}`, event.threadID, event.messageID);
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
                const qClean = cleanText(q); // টিচ করার সময়ও প্রশ্ন ক্লিন হবে
                for (const a of answers) {
                    await axios.get(`${baseApiUrl}/teach`, {
                        params: { ask: qClean, ans: a.trim(), teacher: teacherName },
                        timeout: 10000
                    });
                }
            }

            const successMsg = `╭───『 **SUCCESSFUL** 』───⟡\n│ 📝 **Questions:** ${questions.length}\n│ 📩 **Answers:** ${answers.length}\n│ 👤 **Teacher:** ${teacherName}\n╰───────────────⟡ ${getEmoji()}`;
            return api.sendMessage(successMsg, event.threadID, event.messageID);
        }

        // --- Remove Command ---
        if (args[0] === 'remove') {
            if (!allowedThreads.includes(event.threadID)) {
                return api.sendMessage(`⚠️ Access Restrictions! ${getEmoji()}`, event.threadID, event.messageID);
            }
            const content = dipto.replace("remove ", "");
            const [ask, ans] = content.split(/\s*-\s*/);
            const res = await axios.get(`${baseApiUrl}/remove`, {
                params: { ask: cleanText(ask), ans: ans.trim() }
            });
            return api.sendMessage(res.data.status === "success" ? `✅ Removed! ${getEmoji()}` : `❌ Not found! ${getEmoji()}`, event.threadID, event.messageID);
        }

        // --- Stats Commands ---
        if (args[0] === 'list') {
            const res = await axios.get(`${baseApiUrl}/list`);
            const teachers = res.data.teachers.map((t, i) => `${i+1}. ${t.teacher_name} [${t.teach_count}]`).join('\n');
            return api.sendMessage(`📜 **Teacher Contributions:**\n${teachers} ${getEmoji()}`, event.threadID, event.messageID);
        }

        // --- Default Chat (With Cleaner & Emoji) ---
        const chatRes = await axios.get(`${baseApiUrl}`, {
            params: { text: cleanedDipto }, // ক্লিন করা টেক্সট পাঠানো হলো
            timeout: 10000
        });
        return api.sendMessage(`${chatRes.data.reply} ${getEmoji()}`, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                author: event.senderID
            });
        }, event.messageID);

    } catch (e) {
        return api.sendMessage(`⚠️ API Busy or Offline. ${getEmoji()}`, event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event }) => {
    try {
        const cleanedReply = cleanText(event.body);
        const res = await axios.get(`${baseApiUrl}`, {
            params: { text: cleanedReply },
            timeout: 10000
        });
        return api.sendMessage(`${res.data.reply} ${getEmoji()}`, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                author: event.senderID
            });
        }, event.messageID);
    } catch (err) {
        return api.sendMessage(`⚠️ Connection error. ${getEmoji()}`, event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event, usersData }) => {
    if (event.body) {
        const body = event.body.toLowerCase();
        const triggers = ["baby", "bby", "citti", "hinata", "বট", "বেবি"];
        const hasTrigger = triggers.some(t => body.startsWith(t));
        const hasPrefix = global.GoatBot.config.prefix && body.startsWith(global.GoatBot.config.prefix);

        if (hasTrigger && !hasPrefix) {
            const rawText = body.replace(/^\S+\s*/, "");
            const cleanedText = cleanText(rawText);
            const uid = event.senderID;
            const userData = await usersData.get(uid);
            let displayName = userData.name;
            if (uid === "61585634146171") displayName = "Sir";
            
            if (!cleanedText) {
                return api.sendMessage(`Yes ${displayName}, bolo ki bolbe? ${getEmoji()}`, event.threadID, (error, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        author: event.senderID
                    });
                }, event.messageID);
            }

            try {
                const res = await axios.get(`${baseApiUrl}`, {
                    params: { text: cleanedText },
                    timeout: 10000
                });
                return api.sendMessage(`${res.data.reply} ${getEmoji()}`, event.threadID, (error, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        author: event.senderID
                    });
                }, event.messageID);
            } catch (err) { console.log(err); }
        }
    }
};
            
