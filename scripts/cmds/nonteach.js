const axios = require('axios');

const baseApiUrl = "https://nawab-api.onrender.com/api/bby";

module.exports.config = {
    name: "non-teach",
    aliases: ["nt", "nonteach"],
    version: "2.0.0",
    author: "Nawab",
    countDown: 5,
    role: 0,
    description: "Answer questions to help the bot learn.",
    category: "chat",
    guide: "{pn}"
};

module.exports.onStart = async ({ api, event }) => {
    try {
        // API থেকে র্যান্ডম প্রশ্ন আনা
        const response = await axios.get(`${baseApiUrl}/questions`);
        const randomQuestion = response.data.question;
        const totalAvailable = Math.floor(Math.random() * 50000) + 100000;

        const msg = `🧠 **Next Question:** 🤯\n\n"${randomQuestion}"\n\n📦 **Available:** ${totalAvailable}\n💬 Reply this message with your answer.`;

        return api.sendMessage(msg, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                type: "teach_reply",
                question: randomQuestion,
                author: event.senderID
            });
        }, event.messageID);

    } catch (e) {
        return api.sendMessage("⚠️ Server is busy. Try again later!", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply, usersData, Currencies }) => {
    const { question, author, type } = Reply;
    if (event.senderID !== author || type !== "teach_reply") return;

    try {
        const answer = event.body;
        const teacherName = (await usersData.get(author)).name;

        // আপনার API-তে ডাটা সেভ করা (bby কমান্ডের ডাটাবেজেই সেভ হবে)
        await axios.get(`${baseApiUrl}/teach?ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}&teacher=${encodeURIComponent(teacherName)}`);

        // টিচারের মোট টিচ সংখ্যা জানার জন্য লিস্ট চেক করা
        const listRes = await axios.get(`${baseApiUrl}/list`);
        const teacherStats = listRes.data.teachers.find(t => t.teacher_name === teacherName);
        const totalTeachs = teacherStats ? teacherStats.teach_count : "1";

        // রিওয়ার্ড সিস্টেম (GoatBot V2 এর জন্য)
        if (Currencies) {
            await Currencies.increaseMoney(author, 1000);
        }

        const successMsg = `✅ **Reply saved:**\nReplies "${answer}" added to "${question}".\n\n👤 **Teacher:** ${teacherName}\n📚 **Total Teachs:** ${totalTeachs}\n\n🎁 **Earned:** +1000$ & +100 EXP`;

        api.sendMessage(successMsg, event.threadID, event.messageID);
        global.GoatBot.onReply.delete(Reply.messageID);

    } catch (err) {
        return api.sendMessage("❌ Error saving reply!", event.threadID, event.messageID);
    }
};
          
