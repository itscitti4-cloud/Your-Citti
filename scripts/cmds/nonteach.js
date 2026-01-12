const axios = require('axios');
const baseApiUrl = "https://nawab-api-i2z3.onrender.com/api/bby";

// অনুমোদিত গ্রুপ আইডির তালিকা
const allowedThreads = ["2593974107646263", "25416434654648555"];
const supportGroupURL = "https://m.me/j/Aba7VamWeZbYqZDQ/"; // আপনার সাপোর্ট গ্রুপের আসল লিংক এখানে দিন

module.exports.config = {
    name: "nonteach",
    aliases: ["nt"],
    version: "3.7.0",
    author: "Nawab",
    countDown: 5,
    role: 0,
    description: "Learn and answer questions with auto-next feature and group locking.",
    category: "chat",
    guide: "{pn} OR {pn} repeat"
};

// --- মেইন প্রশ্ন পাঠানোর ফাংশন ---
async function sendQuestion(api, event, args, commandName) {
    // থ্রেড লক চেক
    if (!allowedThreads.includes(event.threadID)) {
        return api.sendMessage(`⚠️ Access Restrictions! This group doesn't have permission to teach me.\n\nYou can teach me on our official groups. To join our support group, type: {p}supportgc`, event.threadID);
    }

    try {
        const type = args && args[0] === "repeat" ? "repeat" : "new";
        const response = await axios.get(`${baseApiUrl}/questions?type=${type}`);
        const randomQuestion = response.data.question;

        if (!randomQuestion) throw new Error("No question found");

        const msg = type === "repeat" 
            ? `🔄 **Repeat Question (Add more answers):**\n\n"${randomQuestion}"` 
            : `🧠 **Next Unanswered Question:**\n\n"${randomQuestion}"`;

        return api.sendMessage(msg + `\n\n💬 Reply with answer!`, event.threadID, (error, info) => {
            if (error) return console.log(error);
            global.GoatBot.onReply.set(info.messageID, {
                commandName: commandName,
                type: "teach_reply",
                question: randomQuestion,
                author: event.senderID,
                args: args
            });
        }, event.messageID);
    } catch (e) { 
        return api.sendMessage("⚠️ API Offline or No more questions available right now!", event.threadID); 
    }
}

module.exports.onStart = async ({ api, event, args }) => {
    return await sendQuestion(api, event, args, this.config.name);
};

module.exports.onReply = async ({ api, event, Reply, usersData, Currencies }) => {
    const { question, author, args, commandName } = Reply;

    // রিপ্লাই এর ক্ষেত্রেও থ্রেড লক চেক
    if (!allowedThreads.includes(event.threadID)) return;
    
    // শুধুমাত্র যে ইউজার !nt লিখেছে সে উত্তর দিলে কাজ করবে
    if (event.senderID !== author) return;

    try {
        const answer = event.body;
        if (!answer) return;

        const userData = await usersData.get(author);
        const teacherName = userData.name || "Unknown";

        // আপনার API-তে ডাটা সেভ করা
        await axios.get(`${baseApiUrl}/teach`, {
            params: {
                ask: question,
                ans: answer,
                teacher: teacherName
            }
        });
        
        // রিওয়ার্ড প্রদান
        if (Currencies) await Currencies.increaseMoney(author, 1000);
        
        // লিস্ট এবং স্ট্যাটাস আনা
        let teacherStats;
        try {
            const listRes = await axios.get(`${baseApiUrl}/list`);
            teacherStats = listRes.data.teachers.find(t => t.teacher_name === teacherName);
        } catch(e) { /* stats handle */ }

        // সেভ হওয়ার পর কনফার্মেশন পাঠানো
        await api.sendMessage(`✅ **Saved!**\n👤 Teacher: ${teacherName}\n📚 Total Teachs: ${teacherStats?.teach_count || 1}\n🎁 +1000$ & +100 EXP\n\n🔄 Fetching next question...`, event.threadID);

        // আগের রিপ্লাই হ্যান্ডলারটি মুছে ফেলা
        global.GoatBot.onReply.delete(Reply.messageID);

        // পরবর্তী প্রশ্ন পাঠানোর জন্য ফাংশন কল
        return await sendQuestion(api, event, args, commandName);

    } catch (err) { 
        console.error("Teach Error:", err.response ? err.response.data : err.message);
        api.sendMessage("❌ Error saving reply! Please try again.", event.threadID); 
    }
};
