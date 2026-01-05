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
    version: "3.2.1",
    author: "AkHi",
    countDown: 5,
    role: 0,
    description: "Advanced Teach with Emoji Injection & Auto-Emoji Response",
    category: "chat",
    guide: "{pn} [message]\n{pn} teach [Q] - [A]\n{pn} teach (hi/hello) 😊 - Hi Sweetie\n{pn} teach Q1 + Q2 - A1 + A2"
};

if (!global.babyContext) global.babyContext = new Map();

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

        const hasEmoji = /\p{Emoji}/u.test(text);

        if (match && match.answer) {
            await client.close();
            const answers = match.answer.split(/\s*\+\s*/);
            let finalReply = answers[Math.floor(Math.random() * answers.length)];
            
            const randomEmoji = autoEmojis[Math.floor(Math.random() * autoEmojis.length)];
            if (!/\p{Emoji}/u.test(finalReply) || hasEmoji) {
                finalReply += ` ${randomEmoji}`;
            }
            return finalReply;
        }
        await client.close();

        // API কল করার সময় একই মেসেজ এড়াতে কন্ডিশন
        const link = "https://baby-apisx.vercel.app/baby";
        const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderID=${senderID}&font=1`);
        let apiReply = res.data.reply;

        if (apiReply.includes("teach me") && text.length < 2) return "বলো জানু, শুনছি! 😊";

        if (hasEmoji && !/\p{Emoji}/u.test(apiReply)) {
            apiReply += ` ${autoEmojis[Math.floor(Math.random() * autoEmojis.length)]}`;
        }
        return apiReply;
    } catch (err) {
        if (client) await client.close();
        return null;
    }
}

// কমন রিপ্লাই ফাংশন (ডবল রিপ্লাই এড়াতে)
async function handleReply(api, event, text) {
    const reply = await getReply(text, event.senderID);
    if (reply) {
        global.babyContext.set(event.senderID, text);
        api.sendMessage(reply, event.threadID, (err, info) => {
            if (info) {
                // রিপ্লাই সেট করা হচ্ছে যাতে চেইন বজায় থাকে
                if (global.GoatBot && global.GoatBot.onReply) {
                    global.GoatBot.onReply.set(info.messageID, { 
                        commandName: "bby", 
                        author: event.senderID 
                    });
                }
            }
        }, event.messageID);
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
                await collection.updateOne(
                    { question: q.trim() },
                    { $set: { uid: String(senderID), answer: answers.trim(), time: new Date() } },
                    { upsert: true }
                );
            }
            await client.close();
            return api.sendMessage(`✅ Added/Updated ${qList.length} questions!`, threadID, messageID);
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

    // Top/List logic remain same...
    if (args[0] === 'top' || args[0] === 'list') {
        try {
            await client.connect();
            const collection = client.db(dbName).collection(collectionName);
            if (args[0] === 'top') {
                const topTeachers = await collection.aggregate([{ $group: { _id: "$uid", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]).toArray();
                let msg = "🏆 [ TOP TEACHERS ] 🏆\n\n";
                for (let i = 0; i < topTeachers.length; i++) {
                    try {
                        const info = await api.getUserInfo(topTeachers[i]._id);
                        msg += `${i + 1}. ${info[topTeachers[i]._id].name}: ${topTeachers[i].count} Teach\n`;
                    } catch(e) { msg += `${i + 1}. Unknown: ${topTeachers[i].count}\n`; }
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

    await handleReply(api, event, input);
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (Reply.commandName !== this.config.name) return;
    // এখানে শুধু রিপ্লাই হ্যান্ডেল হবে
    await handleReply(api, event, event.body);
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;
    const { threadID, messageID, senderID, mentions, body } = event;

    // মেনশন চেক
    if (mentions && (mentions[ADMIN_1] || mentions[ADMIN_2])) {
        const msg = mentions[ADMIN_1] ? "আখি ম্যাম'কে মেনশন দিছো কেন?" : "নবাব সাহেব'কে মেনশন দিছো কেন?";
        return api.sendMessage(msg, threadID, messageID);
    }

    // যদি এটি কোনো রিপ্লাই হয়, তবে onReply এটি হ্যান্ডেল করবে। onChat এ ডবল রিপ্লাই এড়াতে রিপ্লাই কন্ডিশন বাদ দেওয়া হয়েছে।
    if (event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) return;

    const lowerBody = body.toLowerCase();
    const triggers = ["bby", "baby", "citti", "bot", "বেবি", "বট"];
    const matchedTrigger = triggers.find(t => lowerBody.startsWith(t));

    if (matchedTrigger) {
        let text = body.slice(matchedTrigger.length).trim();
        await handleReply(api, event, text || "হুম");
    }
};
