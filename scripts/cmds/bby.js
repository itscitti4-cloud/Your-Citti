const axios = require('axios');
const { MongoClient } = require("mongodb");

const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "test";
const collectionName = "babies";
const specialCollection = "special_chat"; // আলাদা রিপ্লাইয়ের জন্য

// নির্দিষ্ট আইডি দুটি
const ADMIN_1 = "61583939430347"; // আখি ম্যাম
const ADMIN_2 = "61585634146171"; // নবাব সাহেব

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot", "citti"],
    version: "3.0.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Chat with Citti and advanced teaching system",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [Q1 + Q2] - [A1 x A2]\n{pn} teach [Hey baby (kemon/kmn) (achis/acho/achen - Alhamdulillah Shukia)"
};

// ইমোজি এবং সিম্বল ক্লিন করার ফাংশন
function cleanText(text) {
    return text.replace(/[^\w\s\u0980-\u09FF]/gi, '').replace(/\s+/g, ' ').trim();
}

async function getReply(text, senderID, isSpecial = false) {
    let client;
    try {
        client = new MongoClient(mongoURI);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(isSpecial ? specialCollection : collectionName);
        
        const cleanedInput = cleanText(text);
        
        // RegExp matching for (word1/word2) format
        const mongoData = await collection.findOne({ 
            question: { $regex: new RegExp(cleanedInput.replace(/\((.*?)\)/g, ".*"), "i") } 
        });

        if (mongoData && mongoData.answer) {
            await client.close();
            // (×) অথবা (,) দিয়ে স্প্লিট করা
            const separator = mongoData.answer.includes('×') ? /\s*×\s*/ : /\s*,\s*/;
            const answers = mongoData.answer.split(separator);
            return answers[Math.floor(Math.random() * answers.length)];
        }
        await client.close();

        if (isSpecial) return null;

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

    // --- !bby adteach (Admin special replies) ---
    if (args[0] === 'adteach') {
        const content = args.slice(1).join(" ");
        if (!content.includes('-')) return api.sendMessage('❌ | Format: adteach [Q] - [A]', threadID, messageID);
        const [msg, rep] = content.split(/\s*-\s*/);
        try {
            await client.connect();
            await client.db(dbName).collection(specialCollection).insertOne({
                question: cleanText(msg),
                answer: rep.trim(),
                uid: String(senderID)
            });
            await client.close();
            return api.sendMessage("✅ Admin Special Reply Added!", threadID, messageID);
        } catch (e) { return api.sendMessage("❌ Failed", threadID, messageID); }
    }

    // --- !bby teach logic (Multi-question & Multi-answer) ---
    if (args[0] === 'teach') {
        const content = args.slice(1).join(" ");
        if (!content.includes('-')) return api.sendMessage('❌ | Format: teach [Q1 + Q2] - [A1 x A2]', threadID, messageID);
        
        let [questions, answers] = content.split(/\s*-\s*/);
        const qList = questions.split(/\s*\+\s*/); // (+) দিয়ে একাধিক প্রশ্ন
        
        try {
            await client.connect();
            const collection = client.db(dbName).collection(collectionName);
            for (let q of qList) {
                await collection.insertOne({
                    uid: String(senderID),
                    question: cleanText(q),
                    answer: answers.trim(), // এতে '×' বা ',' থাকতে পারে
                    time: new Date()
                });
            }
            await client.close();
            return api.sendMessage(`✅ Added ${qList.length} questions!`, threadID, messageID);
        } catch (e) { return api.sendMessage("❌ Error", threadID, messageID); }
    }

    // --- !bby rem, top, list (আগের মতোই থাকবে) ---
    if (['rem', 'top', 'list'].includes(args[0])) {
        // [আপনার আগের কোডের rem/top/list লজিক এখানে থাকবে]
    }

    const input = args.join(" ");
    if (!input) return api.sendMessage("জি জানু, বলো!", threadID, messageID);

    const reply = await getReply(input, senderID);
    if (reply) api.sendMessage(reply, threadID, (err, info) => {
        if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
    }, messageID);
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (Reply.commandName !== this.config.name) return;
    const isSpecial = (event.senderID === ADMIN_1 || event.senderID === ADMIN_2);
    const reply = await getReply(event.body, event.senderID, isSpecial);
    if (reply) api.sendMessage(reply, event.threadID, (err, info) => {
        if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: event.senderID });
    }, event.messageID);
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;
    const { threadID, messageID, senderID, mentions } = event;

    // --- মেনশন ডিটেক্টর ---
    if (mentions && Object.keys(mentions).length > 0) {
        // যদি একজন এডমিন অন্যজনকে মেনশন দেয়
        if ((senderID === ADMIN_1 && mentions[ADMIN_2]) || (senderID === ADMIN_2 && mentions[ADMIN_1])) {
            const reply = await getReply(event.body, senderID, true);
            if (reply) return api.sendMessage(reply, threadID, (err, info) => {
                if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
            }, messageID);
        }
        // সাধারণ ইউজার মেনশন দিলে
        if (mentions[ADMIN_1]) return api.sendMessage("আখি ম্যাম'কে মেনশন দিছো কেন? কি সমস্যা তোমার?", threadID, messageID);
        if (mentions[ADMIN_2]) return api.sendMessage("নবাব সাহেব'কে মেনশন দিছো কেন? কি সমস্যা তোমার?", threadID, messageID);
    }

    const body = event.body.toLowerCase();
    const triggers = ["bby", "baby", "citti", "bot", "বেবি", "বট"];
    const matchedTrigger = triggers.find(t => body.startsWith(t));

    if (matchedTrigger) {
        let text = event.body.slice(matchedTrigger.length).trim();
        const reply = await getReply(text || "হুম", senderID);
        if (reply) api.sendMessage(reply, threadID, (err, info) => {
            if (info) global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
        }, messageID);
    }
};
