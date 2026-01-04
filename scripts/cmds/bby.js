const axios = require('axios'); 
const { MongoClient } = require("mongodb");

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "test";
const collectionName = "babies";

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "citti"],
    version: "2.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Hybrid logic with Top Teachers and Teacher List from MongoDB",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [msg] - [reply]\n{pn} top\n{pn} list"
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
            return mongoData.answer;
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
    const input = args.join(" ");

    // --- !bby teach logic ---
    if (args[0] === 'teach') {
        const content = args.slice(1).join(" ");
        if (!content.includes('-')) return api.sendMessage('❌ | Format: teach [Q] - [A]', threadID, messageID);
        const [msg, rep] = content.split(/\s*-\s*/);
        
        let client;
        try {
            client = new MongoClient(mongoURI);
            await client.connect();
            const collection = client.db(dbName).collection(collectionName);
            await collection.insertOne({
                uid: String(senderID),
                question: msg.trim(),
                answer: rep.trim(),
                time: new Date()
            });
            await client.close();
            axios.get(`https://baby-apisx.vercel.app/baby?teach=${encodeURIComponent(msg.trim())}&reply=${encodeURIComponent(rep.trim())}&senderID=${senderID}`).catch(()=>{});
            return api.sendMessage(`✅ Added to MongoDB!\nQ: ${msg.trim()}\nA: ${rep.trim()}`, threadID, messageID);
        } catch (e) { 
            if (client) await client.close();
            return api.sendMessage("❌ MongoDB Save Failed.", threadID, messageID); 
        }
    }

    // --- !bby top (MongoDB Top Teachers) ---
    if (args[0] === 'top') {
        let client;
        try {
            client = new MongoClient(mongoURI);
            await client.connect();
            const collection = client.db(dbName).collection(collectionName);
            
            // ডাটা গ্রুপিং করে কাউন্ট বের করা
            const topTeachers = await collection.aggregate([
                { $group: { _id: "$uid", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray();

            if (topTeachers.length === 0) return api.sendMessage("এখনো কেউ কিছু শেখায়নি।", threadID, messageID);

            let msg = "🏆 [ TOP TEACHERS - MONGO ] 🏆\n\n";
            for (let i = 0; i < topTeachers.length; i++) {
                const info = await api.getUserInfo(topTeachers[i]._id);
                const name = info[topTeachers[i]._id].name;
                msg += `${i + 1}. ${name}: ${topTeachers[i].count} টিচ\n`;
            }
            await client.close();
            return api.sendMessage(msg, threadID, messageID);
        } catch (e) {
            if (client) await client.close();
            return api.sendMessage("Error fetching top list.", threadID, messageID);
        }
    }

    // --- !bby list (MongoDB Teacher List) ---
    if (args[0] === 'list') {
        let client;
        try {
            client = new MongoClient(mongoURI);
            await client.connect();
            const teachers = await client.db(dbName).collection(collectionName).distinct("uid");
            
            if (teachers.length === 0) return api.sendMessage("টিচার লিস্ট খালি।", threadID, messageID);

            let msg = `📊 [ MONGO TEACHER LIST ]\nমোট টিচার: ${teachers.length} জন\n\n`;
            for (let i = 0; i < teachers.length; i++) {
                const info = await api.getUserInfo(teachers[i]);
                msg += `${i + 1}. ${info[teachers[i]].name}\n`;
            }
            await client.close();
            return api.sendMessage(msg, threadID, messageID);
        } catch (e) {
            if (client) await client.close();
            return api.sendMessage("Error fetching teacher list.", threadID, messageID);
        }
    }

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
        if (!text) return; 

        const reply = await getReply(text, event.senderID);
        if (reply) {
            return api.sendMessage(reply, event.threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
            }, event.messageID);
        }
    }
};
                                    
