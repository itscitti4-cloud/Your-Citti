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
    version: "4.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Fixed Reply Chain, Context Aware & Mention Support",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [Q] - [A]\n{pn} adteach [Q] - [A]"
};

if (!global.babyContext) global.babyContext = new Map();

function cleanText(text) {
    if (!text) return "";
    return text.replace(/[^\w\s\u0980-\u09FF]/gi, '').replace(/\s+/g, ' ').trim();
}

function createRegex(text) {
    let pattern = cleanText(text);
    pattern = pattern.replace(/\((.*?)\)/g, (match, content) => {
        return "(" + content.split('/').map(s => s.trim()).join('|') + ")";
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
        
        const matches = allData.filter(item => {
            const regex = createRegex(item.question);
            return regex.test(cleanedInput);
        });

        if (matches.length > 0) {
            await client.close();
            const selectedMatch = matches[Math.floor(Math.random() * matches.length)];
            const separator = selectedMatch.answer.includes('×') ? /\s*×\s*/ : /\s*,\s*/;
            const answers = selectedMatch.answer.split(separator);
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

    if (args[0] === 'teach' || args[0] === 'adteach') {
        if (args[0] === 'adteach' && (senderID !== ADMIN_1 && senderID !== ADMIN_2)) {
            return api.sendMessage("❌ Access Denied", threadID, messageID);
        }
        const content = args.slice(1).join(" ");
        if (!content.includes('-')) return api.sendMessage('❌ Format: teach [Q] - [A]', threadID, messageID);
        let [questions, answers] = content.split(/\s*-\s*/);
        const qList = questions.split(/\s*\+\s*/);
        try {
            await client.connect();
            const collection = client.db(dbName).collection(collectionName);
            for (let q of qList) {
                await collection.insertOne({ uid: String(senderID), question: q.trim(), answer: answers.trim(), time: new Date() });
            }
            await client.close();
            return api.sendMessage(`✅ Added ${qList.length} questions!`, threadID, messageID);
        } catch (e) { return api.sendMessage("❌ Error saving data", threadID, messageID); }
    }

    const input = args.join(" ");
    if (!input) return api.sendMessage("জি জানু, বলো!", threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
    }, messageID);

    const reply = await getReply(input, senderID);
    if (reply) {
        global.babyContext.set(senderID, input);
        api.sendMessage(reply, threadID, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
        }, messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    const { threadID, messageID, senderID, body } = event;
    if (Reply.commandName !== this.config.name) return;
    
    const reply = await getReply(body, senderID);
    if (reply) {
        global.babyContext.set(senderID, body);
        api.sendMessage(reply, threadID, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
        }, messageID);
    }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;
    const { threadID, messageID, senderID, mentions, body } = event;

    // --- মেনশন ডিটেক্টর (অ্যাডমিনদের জন্য মেসেজ) ---
    if (mentions && Object.keys(mentions).length > 0) {
        if (mentions[ADMIN_1]) return api.sendMessage("আখি ম্যাম'কে মেনশন দিছো কেন? কি সমস্যা তোমার?", threadID, messageID);
        if (mentions[ADMIN_2]) return api.sendMessage("নবাব সাহেব'কে মেনশন দিছো কেন? কি সমস্যা তোমার?", threadID, messageID);
    }

    // --- রিপ্লাই চেইন লজিক ---
    if (event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) {
        const reply = await getReply(body, senderID);
        if (reply) {
            global.babyContext.set(senderID, body);
            return api.sendMessage(reply, threadID, (err, info) => {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
            }, messageID);
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
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID });
            }, messageID);
        }
    }
};
                                   
