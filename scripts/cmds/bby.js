const axios = require('axios'); 
const { MongoClient } = require("mongodb");

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "test";
const collectionName = "babies";

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "citti"],
    version: "2.3.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Hybrid logic with delete features and multiple response handling",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [Q] - [A]\n{pn} rem qus [Q]\n{pn} rem ans [A]\n{pn} top\n{pn} list"
};

async function getReply(text, senderID) {
    let client;
    try {
        client = new MongoClient(mongoURI);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const mongoData = await collection.findOne({ 
            question: { $regex: new RegExp(`^${text.trim()}$`, "i") } 
        });

        if (mongoData && mongoData.answer) {
            await client.close();
            // কমা থাকলে স্লিট করে র‍্যান্ডম একটি উত্তর দিবে
            const answers = mongoData.answer.split(/\s*,\s*/);
            return answers[Math.floor(Math.random() * answers.length)];
        }
        await client.close();

        const link = "https://baby-apisx.vercel.app/baby";
        const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderID=${senderID}&font=1`);
        return res.data.reply;
    } catch (err) {
        if (client) await client.close();
        return null;
    }
}

module.exports.onStart = async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const client = new MongoClient(mongoURI);

    // --- !bby teach logic ---
    if (args[0] === 'teach') {
        const content = args.slice(1).join(" ");
        if (!content.includes('-')) return api.sendMessage('❌ | Format: teach [Q] - [A]', threadID, messageID);
        const [msg, rep] = content.split(/\s*-\s*/);
        
        try {
            await client.connect();
            const collection = client.db(dbName).collection(collectionName);
            await collection.insertOne({
                uid: String(senderID),
                question: msg.trim(),
                answer: rep.trim(),
                time: new Date()
            });
            await client.close();
            return api.sendMessage(`✅ Added!\nQ: ${msg.trim()}\nA: ${rep.trim()}`, threadID, messageID);
        } catch (e) { 
            return api.sendMessage("❌ MongoDB Save Failed.", threadID, messageID); 
        }
    }

    // --- !bby rem qus <question> ---
    if (args[0] === 'rem' && args[1] === 'qus') {
        const targetQ = args.slice(2).join(" ");
        if (!targetQ) return api.sendMessage("❌ প্রশ্নটি লিখুন।", threadID, messageID);
        try {
            await client.connect();
            const res = await client.db(dbName).collection(collectionName).deleteMany({ 
                question: { $regex: new RegExp(`^${targetQ.trim()}$`, "i") } 
            });
            await client.close();
            return api.sendMessage(res.deletedCount > 0 ? `✅ "${targetQ}" সম্পর্কিত সব প্রশ্ন ডিলিট হয়েছে।` : "❌ কোনো প্রশ্ন পাওয়া যায়নি।", threadID, messageID);
        } catch (e) { return api.sendMessage("❌ Error deleting question.", threadID, messageID); }
    }

    // --- !bby rem ans <answer> ---
    if (args[0] === 'rem' && args[1] === 'ans') {
        const targetA = args.slice(2).join(" ");
        if (!targetA) return api.sendMessage("❌ উত্তরটি লিখুন।", threadID, messageID);
        try {
            await client.connect();
            const res = await client.db(dbName).collection(collectionName).deleteMany({ 
                answer: { $regex: new RegExp(`^${targetA.trim()}$`, "i") } 
            });
            await client.close();
            return api.sendMessage(res.deletedCount > 0 ? `✅ "${targetA}" উত্তরটি ডিলিট হয়েছে।` : "❌ কোনো উত্তর পাওয়া যায়নি।", threadID, messageID);
        } catch (e) { return api.sendMessage("❌ Error deleting answer.", threadID, messageID); }
    }

    // --- !bby top & list ---
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
        } catch (e) { return api.sendMessage("Error fetching data.", threadID, messageID); }
        finally { await client.close(); }
    }

    const input = args.join(" ");
    if (!input) {
        const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "বলো জানু, শুনছি! 😚"];
        return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
        }, messageID);
    }

    const reply = await getReply(input, senderID);
    if (reply) {
        return api.sendMessage(reply, threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
        }, messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (Reply.commandName !== this.config.name) return;
    const reply = await getReply(event.body, event.senderID);
    if (reply) {
        return api.sendMessage(reply, event.threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
        }, event.messageID);
    }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;
    if (event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) return;

    const body = event.body.toLowerCase();
    const triggers = ["bby", "baby", "citti", "bot", "বেবি", "বট"];
    const matchedTrigger = triggers.find(t => body.startsWith(t));

    if (matchedTrigger) {
        let text = event.body.slice(matchedTrigger.length).trim();
        if (!text) {
            const ran = ["জি জানু, বলো!", "হুম শুনছি...", "Bolo baby", "বলো জানু, শুনছি! 😚"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            }, event.messageID);
        }
        const reply = await getReply(text, event.senderID);
        if (reply) {
            return api.sendMessage(reply, event.threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            }, event.messageID);
        }
    }
};
                
