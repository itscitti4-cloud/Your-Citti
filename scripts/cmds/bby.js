const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const cacheDir = path.join(process.cwd(), "scripts/cmds/cache");
const filePath = path.join(cacheDir, "babyData.json");

// --- ডিফল্ট বুদ্ধিমত্তা ডাটাবেস (Fixed Syntax) ---
const commonBrain = {
    "hi": ["Hello!", "Hey there!", "Hi sweetie!", "হেই, কি খবর?"],
    "hello": ["Hi!", "Hello boss!", "জি বলো!", "হ্যালো জানু!"],
    "hlw": ["Hi!", "Hello boss!", "জি বলো!", "হ্যালো জানু!"],
    "কি খবর": ["এই তো ভালো, আপনার কি খবর?", "সব ঠিকঠাক, আপনার কি খবর?"],
    "কী খবর": ["এই তো ভালো, আপনার কি খবর?", "সব ঠিকঠাক, আপনার কি খবর?"],
    "খবর কি": ["এই তো ভালো, আপনি কি খবর?", "সব ঠিকঠাক, আপনার কি খবর?"],
    "খবর কী": ["এই তো ভালো, আপনি কি খবর?", "সব ঠিকঠাক, আপনার কি খবর?"],
    "ki kbr": ["aitw valo, tmr ki khbor?", "sob thik thak, apnr khbor valo tw??"],
    "ki khobor": ["aitw valo, tmr ki khbor?", "sob thik thak, apnr khbor valo tw??"],
    "ki khbr": ["aitw valo, tmr ki khbor?", "sob thik thak, apnr khbor valo tw??"],
    "ki kbor": ["aitw valo, tmr ki khbor?", "sob thik thak, apnr khbor valo tw??"],
    "kmn acho": ["aitw valo, tmr ki khbor?", "Alhamdulillah, apnr khbor valo tw??"],
    "kemon acho": ["aitw valo, tmr ki khbor?", "Alhamdulillah, apnr khbor valo tw??"],
    "kemon aco": ["aitw valo, tmr ki khbor?", "Alhamdulillah Shukria, apnr khbor valo tw??"],
    "kmn aco": ["aitw valo, tmr ki khbor?", "Alhamdulillah Shukria, apnr khbor valo tw??"],
    "ভালোবাসি": ["আমিও তোমাকে অনেক ভালোবাসি!", "ওরে বাবা! হঠাৎ এতো ভালোবাসা কেন?", "আমি তো তোমার প্রেমে পড়ে গেছি!"],
    "janu": ["bol be keya cahiye tereko!", "ki!", "ato dako kno?"],
    "নাম কি": ["আমার নাম citti।", "আপনি চাইলে Hinata ও ডাকতে পারেন।"],
    "tumi ke": ["আমি চিট্টি ।", "আমি আঁখি ম্যামের পার্সোনাল চ্যাটবট।"],
    "ধন্যবাদ": ["আপনাকেও ধন্যবাদ!", "ওয়েলকাম!"],
    "akhi ke": ["আঁখি আমার মালিক।", "আমার এডমিন"],
    "আখি কে": ["আঁখি আমার মালিক।", "আমার এডমিন"]
};

// --- ফোল্ডার ও ফাইল সেটাপ ---
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

function initializeDatabase() {
    let data = { responses: { ...commonBrain }, teachers: {} };
    if (fs.existsSync(filePath)) {
        try {
            const existingData = fs.readJsonSync(filePath);
            data.responses = { ...commonBrain, ...existingData.responses };
            data.teachers = existingData.teachers || {};
        } catch (e) {
            console.error("Error reading database, resetting...");
        }
    }
    fs.writeJsonSync(filePath, data, { spaces: 2 });
}

initializeDatabase();

module.exports.config = {
    name: "bby",
    aliases: ["baby", "hinata", "babe", "citti"],
    version: "13.0.0",
    author: "AkHi & AI",
    countDown: 0,
    role: 0,
    description: "Smart AI Chatbot with Auto-Teach and Common Brain",
    category: "chat",
    guide: {
        en: "1. {pn} teach [Q] - [A]\n2. Just call 'baby' or 'bby'\n3. Reply to bot message to chat."
    }
};

async function getSmartReply(input, data) {
    const text = input.toLowerCase().trim();
    if (!text) return "জি জানু, শুনছি!";
    
    if (data.responses && data.responses[text]) {
        const responses = data.responses[text];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    try {
        const res = await axios.get(`https://api.simsimi.vn/v1/simtalk?text=${encodeURIComponent(text)}&lc=bn`);
        if (res.data && res.data.message) {
            return res.data.message;
        }
    } catch (err) {
        return "হুম বলো জানু, শুনছি তো।";
    }
    return "আমি আপনার কথাটি বুঝতে পারছি না, একটু বুঝিয়ে বলবেন? 🥺";
}

module.exports.onStart = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    let data = fs.readJsonSync(filePath);

    if (!args[0]) return api.sendMessage("জি জানু, বলো কি বলতে চাও? 😘", threadID, messageID);

    const action = args[0].toLowerCase();

    if (action === 'remove' || action === 'rm') {
        const key = args.slice(1).join(" ").toLowerCase();
        if (data.responses[key]) {
            delete data.responses[key];
            fs.writeJsonSync(filePath, data);
            return api.sendMessage(`🗑️ | "${key}" মুছে ফেলা হয়েছে।`, threadID, messageID);
        }
        return api.sendMessage("❌ | মেমোরিতে নেই।", threadID, messageID);
    }

    if (action === 'teach') {
        const content = args.slice(1).join(" ").split("-");
        const ques = content[0]?.toLowerCase().trim();
        const ans = content[1]?.trim();

        if (!ques || !ans) return api.sendMessage("❌ | ফরম্যাট: teach [কথা] - [উত্তর]", threadID, messageID);

        if (!data.responses[ques]) data.responses[ques] = [];
        data.responses[ques].push(ans);
        fs.writeJsonSync(filePath, data);
        return api.sendMessage(`✅ | শিখে গেছি!\n🗣️ কথা: ${ques}\n🤖 উত্তর: ${ans}`, threadID, messageID);
    }

    const result = await getSmartReply(args.join(" "), data);
    return api.sendMessage(result, threadID, messageID);
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (event.senderID == api.getCurrentUserID()) return;
    let data = fs.readJsonSync(filePath);
    const result = await getSmartReply(event.body, data);
    return api.sendMessage(result, event.threadID, (err, info) => {
        if (!err) global.GoatBot.onReply.set(info.messageID, {
            commandName: "bby",
            messageID: info.messageID,
            author: event.senderID
        });
    }, event.messageID);
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID() || !event.body) return;
    const body = event.body.toLowerCase();
    const names = ["baby", "bby", "citti", "babu", "hinata"];
    
    const targetName = names.find(name => body.startsWith(name));

    if (targetName) {
        let data = fs.readJsonSync(filePath);
        const input = body.replace(targetName, "").trim();
        const result = await getSmartReply(input, data);
        return api.sendMessage(result, event.threadID, (err, info) => {
            if (!err) global.GoatBot.onReply.set(info.messageID, {
                commandName: "bby",
                messageID: info.messageID,
                author: event.senderID
            });
        }, event.messageID);
    }
};
