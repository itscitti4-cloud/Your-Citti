const axios = require('axios');
const { MongoClient } = require("mongodb");

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "test";
const collectionName = "babies";

const ADMIN_1 = "61583939430347"; // আখি ম্যাম
const ADMIN_2 = "61585634146171"; // নবাব সাহেব

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "citti"],
    version: "3.2.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Advanced Teach with Emoji Injection & Auto-Emoji Response",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [Q] - [A]\n{pn} teach (hi/hello) 😊 - Hi Sweetie\n{pn} teach Q1 + Q2 - A1 + A2"
};

if (!global.babyContext) global.babyContext = new Map();

// অটো ইমোজি লিস্ট
const autoEmojis = ["😊", "😇", "🙂", "😘", "😍", "🙈", "✨", "🌸", "💫", "🐾", "🐥", "🍬", "🎀","😾", "🥹", "🫩", "😴", "🙂", "🫡", "😩", "😕", "🐸", "🤨", "🦵", "😤", "🤫"];

function cleanText(text) {
    if (!text) return "";
    return text.replace(/\s+/g, ' ').trim();
}

function createRegex(text) {
    let pattern = cleanText(text);
    pattern = pattern.replace(/[.*+?^${}|[\]\\]/g, '\\$&');
    pattern = pattern.replace(/\\\((.*?)\\\)/g, (match, content) => {
        return "(" + content.replace(/\\/g, '').split('/').map(s => s.trim()).join('|') + ")";
    });
    return new RegExp(`^${pattern}$`, "i");
}

async function getReply(text, senderID) {
    let client;
    try {
        client = new MongoClient(mongoURI);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const cleanedInput = cleanText(text);
        const allData = await collection.find({}).toArray();
        
        const match = allData.find(item => {
            const regex = createRegex(item.question);
            return regex.test(cleanedInput);
        });

        // ইমোজি ডিটেক্টর (ইউজার ইমোজি দিলে বটও দিবে)
        const hasEmoji = /\p{Emoji}/u.test(text);

        if (match && match.answer) {
            await client.close();
            const answers = match.answer.split(/\s*\+\s*/);
            let finalReply = answers[Math.floor(Math.random() * answers.length)];
            
            // অটো ইমোজি যুক্ত করা (যদি উত্তরে অলরেডি না থাকে)
            const randomEmoji = autoEmojis[Math.floor(Math.random() * autoEmojis.length)];
            if (!/\p{Emoji}/u.test(finalReply) || hasEmoji) {
                finalReply += ` ${randomEmoji}`;
            }
            return finalReply;
        }
        await client.close();

        const link = "https://baby-apisx.vercel.app/baby";
        const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderID=${senderID}&font=1`);
        let apiReply = res.data.reply;

        // API উত্তরেও ইমোজি না থাকলে বা ইউজার ইমোজি দিলে ইমোজি যোগ হবে
        if (hasEmoji && !/\p{Emoji}/u.test(apiReply)) {
            apiReply += ` ${autoEmojis[Math.floor(Math.random() * autoEmojis.length)]}`;
        }
        return apiReply;
    } catch (err) {
        if (client) await client.close();
        return null;
    }
}

module.exports.onStart = async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const client = new MongoClient(mongoURI);

    if (args[0] === 'teach') {
        const content = args.slice(1).join(" ");
        if (!content.includes('-')) return api.sendMessage('❌ | Format: teach [Q] - [A]', threadID, messageID);
        let [questions, answers] = content.split(/\s*-\s*/);
        const qList = questions.split(/\s*\+\s*/);
        
        try {
            await client.connect();
            const collection = client.db(dbName).collection(collectionName);
            for (let q of qList) {
                await collection.insertOne({
                    uid: String(senderID),
                    question: q.trim(),
                    answer: answers.trim(),
                    time: new Date()
                });
            }
            await client.close();
            return api.sendMessage(`✅ Added ${qList.length} questions!`, threadID, messageID);
        } catch (e) { return api.sendMessage("❌ Error saving.", threadID, messageID); }
    }

    if (args[0] === 'rem' && args[1] === 'qus') {
        const targetQ = args.slice(2).join(" ");
        try {
            await client.connect();
            const res = await client.db(dbName).collection(collectionName).deleteMany({ 
                question: targetQ.trim() 
            });
            await client.close();
            return api.sendMessage(res.deletedCount > 0 ? `✅ Deleted.` : "❌ Not found.", threadID, messageID);
        } catch (e) { return api.sendMessage("❌ Error.", threadID, messageID); }
    }

    if (args[0] === 'top' || args[0] === 'list') {
        try {
            await client.connect();
            const collection = client.db(dbName).collection(collectionName);
            if (args[0] === 'top') {
                const topTeachers = await collection.aggregate([{ $group: { _id: "$uid", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]).toArray();
                let msg = "🏆 [ TOP TEACHERS ] 🏆\n\n";
                for (let i = 0; i < topTeachers.length; i++) {
                    const info = await api.getUserInfo(topTeachers[i]._id);
                    msg += `${i + 1}. ${info[topTeachers[i]._id].name}: ${topTeachers[i].count} Teach\n`;
                }
                return api.sendMessage(msg, threadID, messageID);
            } else {
                const teachers = await collection.distinct("uid");
                let msg = `[ TEACHER LIST ]\ntotal: ${teachers.length}\n\n`;
                for (let i = 0; i < teachers.length; i++) {
                    const info = await api.getUserInfo(teachers[i]);
                    msg += `${i + 1}. ${info[teachers[i]].name}\n`;
                }
                return api.sendMessage(msg, threadID, messageID);
            }
        } catch (e) { return api.sendMessage("Error.", threadID, messageID); }
        finally { await client.close(); }
    }

    const input = args.join(" ");
    if (!input) return api.sendMessage("জি জানু, বলো!", threadID, (err, info) => {
        if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
    }, messageID);

    const reply = await getReply(input, senderID);
    if (reply) {
        global.babyContext.set(senderID, input);
        api.sendMessage(reply, threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
        }, messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (Reply.commandName !== this.config.name) return;
    const reply = await getReply(event.body, event.senderID);
    if (reply) {
        global.babyContext.set(event.senderID, event.body);
        api.sendMessage(reply, event.threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
        }, event.messageID);
    }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;
    const { threadID, messageID, senderID, mentions, body } = event;

    if (mentions && Object.keys(mentions).length > 0) {
        if (mentions[ADMIN_1]) return api.sendMessage("আখি ম্যাম'কে মেনশন দিছো কেন?", threadID, messageID);
        if (mentions[ADMIN_2]) return api.sendMessage("নবাব সাহেব'কে মেনশন দিছো কেন?", threadID, messageID);
    }

    if (event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) {
        const reply = await getReply(body, senderID);
        if (reply) {
            global.babyContext.set(senderID, body);
            api.sendMessage(reply, threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
            }, messageID);
            return;
        }
    }

    const lowerBody = body.toLowerCase();
    const triggers = ["bby", "baby", "citti", "bot", "বেবি", "বট"];
    const matchedTrigger = triggers.find(t => lowerBody.startsWith(t));

    if (matchedTrigger) {
        let text = body.slice(matchedTrigger.length).trim();
        const reply = await getReply(text || "হুম", senderID);
        if (reply) {
            global.babyContext.set(senderID, text || "হুম");
            api.sendMessage(reply, threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
            }, messageID);
        }
    }
};
        
