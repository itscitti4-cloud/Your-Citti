const axios = require('axios');
const baseApiUrl = "https://nawab-api.onrender.com/api/bby";

module.exports.config = {
    name: "nonteach",
    aliases: ["nt"],
    version: "3.0.0",
    author: "Nawab",
    countDown: 5,
    role: 0,
    description: "Learn and answer questions.",
    category: "chat",
    guide: "{pn} OR {pn} repeat"
};

module.exports.onStart = async ({ api, event, args }) => {
    try {
        const type = args[0] === "repeat" ? "repeat" : "new";
        const response = await axios.get(`${baseApiUrl}/questions?type=${type}`);
        const randomQuestion = response.data.question;

        const msg = type === "repeat" ? `🔄 **Repeat Question (Add more answers):**\n\n"${randomQuestion}"` : `🧠 **Next Unanswered Question:**\n\n"${randomQuestion}"`;

        return api.sendMessage(msg + `\n\n💬 Reply with answer!`, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                type: "teach_reply",
                question: randomQuestion,
                author: event.senderID
            });
        }, event.messageID);
    } catch (e) { return api.sendMessage("⚠️ API Offline!", event.threadID); }
};

module.exports.onReply = async ({ api, event, Reply, usersData, Currencies }) => {
    const { question, author } = Reply;
    if (event.senderID !== author) return;

    try {
        const answer = event.body;
        const teacherName = (await usersData.get(author)).name;
        await axios.get(`${baseApiUrl}/teach?ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}&teacher=${encodeURIComponent(teacherName)}`);
        
        if (Currencies) await Currencies.increaseMoney(author, 1000);
        
        const listRes = await axios.get(`${baseApiUrl}/list`);
        const teacherStats = listRes.data.teachers.find(t => t.teacher_name === teacherName);

        api.sendMessage(`✅ **Saved!**\nTeacher: ${teacherName}\nTotal Teachs: ${teacherStats?.teach_count || 1}\n🎁 +1000$ & +100 EXP`, event.threadID, event.messageID);
        global.GoatBot.onReply.delete(Reply.messageID);
    } catch (err) { api.sendMessage("❌ Error!", event.threadID); }
};
