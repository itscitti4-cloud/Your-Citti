const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const cacheDir = path.join(process.cwd(), "scripts/cmds/cache");
const filePath = path.join(cacheDir, "babyData.json");

if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

if (!fs.existsSync(filePath)) {
    const initialData = {
        responses: {},
        teachers: {}
    };
    fs.writeJsonSync(filePath, initialData);
}

module.exports.config = {
    name: "bby",
    aliases: ["baby", "hinata", "babe", "citti"],
    version: "12.0.0",
    author: "AkHi & AI",
    countDown: 0,
    role: 0,
    description: "Smart AI Chatbot with Auto-Teach and Render API",
    category: "chat",
    guide: {
        en: "1. [Prefix] {pn} teach [Q] - [A]\n2. [No-Prefix] Just call 'baby' or 'bby'\n3. [Continuous] Reply to bot message to chat."
    }
};

// --- ফাংশন: স্মার্ট রিপ্লাই এবং অটো-টিচ লজিক ---
async function getSmartReply(input, data) {
    const text = input.toLowerCase().trim();
    if (!text) return "বলো জানু, শুনছি!";
    
    // ১. লোকাল ডাটাবেজ চেক
    if (data.responses && data.responses[text] && data.responses[text].length > 0) {
        const responses = data.responses[text];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // ২. উত্তর না থাকলে API থেকে আনা এবং অটো-সেভ (Auto-Teach)
    try {
        const res = await axios.get(`https://my-simi-api.onrender.com/simi?text=${encodeURIComponent(text)}`);
        
        if (res.data && res.data.reply) {
            const botReply = res.data.reply;

            // অটো-টিচ লজিক: API এর উত্তরটি লোকাল মেমরিতে সেভ করে রাখা
            if (!data.responses[text]) data.responses[text] = [];
            // ডুপ্লিকেট চেক করে পুশ করা
            if (!data.responses[text].includes(botReply)) {
                data.responses[text].push(botReply);
                fs.writeJsonSync(filePath, data); // ডাটা সেভ করা
            }

            return botReply;
        } else {
            return "আমি আপনার কথাটি বুঝতে পারছি না, একটু বুঝিয়ে বলবেন? 🥺";
        }
    } catch (err) {
        return "আমার বুদ্ধিমত্তা এখন কাজ করছে না, কিছুক্ষণ পর চেষ্টা করুন। ⚠️";
    }
}

// --- ১. Prefix কমান্ড হ্যান্ডলার (Manual Teach/Remove) ---
module.exports.onStart = async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    let data = fs.readJsonSync(filePath);

    try {
        if (!args[0]) return api.sendMessage("জি জানু, বলো কি বলতে চাও? 😘", threadID, messageID);

        const action = args[0].toLowerCase();

        if (action === 'remove' || action === 'rm') {
            const key = args.slice(1).join(" ").toLowerCase();
            if (data.responses && data.responses[key]) {
                delete data.responses[key];
                fs.writeJsonSync(filePath, data);
                return api.sendMessage(`🗑️ | "${key}" এর উত্তর মুছে ফেলা হয়েছে।`, threadID, messageID);
            }
            return api.sendMessage("❌ | এই কথাটি আমার মেমোরিতে নেই।", threadID, messageID);
        }

        if (action === 'teach') {
            const content = args.slice(1).join(" ").split(/\s*-\s*/);
            const ques = content[0]?.toLowerCase().trim();
            const ans = content[1]?.trim();

            if (!ques || !ans) return api.sendMessage("❌ | সঠিক ফরম্যাট: {pn} teach [কথা] - [উত্তর]", threadID, messageID);

            if (!data.responses[ques]) data.responses[ques] = [];
            data.responses[ques].push(ans);
            
            if (!data.teachers) data.teachers = {};
            data.teachers[senderID] = (data.teachers[senderID] || 0) + 1;

            fs.writeJsonSync(filePath, data);
            return api.sendMessage(`✅ | শেখানো সফল হয়েছে!\n🗣️ কথা: ${ques}\n🤖 উত্তর: ${ans}`, threadID, messageID);
        }
    } catch (e) {
        api.sendMessage("Error: " + e.message, threadID, messageID);
    }
};

// --- ২. Continuous Reply হ্যান্ডলার ---
module.exports.onReply = async ({ api, event }) => {
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

// --- ৩. No-Prefix (নাম ধরে ডাকলে) হ্যান্ডলার ---
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
        
