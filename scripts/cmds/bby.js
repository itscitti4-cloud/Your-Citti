const fs = require('fs-extra');
const path = __dirname + '/cache/babyData.json';

// ডেটাবেস ফাইল সেটআপ
if (!fs.existsSync(path)) {
    fs.writeJsonSync(path, {
        responses: {
            "আখি কে": ["আমার ম্যাম।"],
            "admin ke": ["আখি ম্যাম।"],
            "এডমিন কে": ["আখি ম্যাম।"],
            "akhi ke": ["আমার ম্যাম।"]
            "tore banaiche ke": ["Lubna Jannat AkHi"]
                
// ফাইল না থাকলে তৈরি করার ফাংশন
if (!fs.existsSync(path)) {
    fs.writeJsonSync(path, {
        responses: {},    // এখানে কথা শেখানো ডেটা থাকবে
        teachers: {},     // কে কতটুকু শিখিয়েছে
        randomReplies: [
            "babu khuda lagse🥺", "Hop beda😾", "আমাকে ডাকলে ,আমি কিন্তূ কিস করে দেবো😘 ", "🐒🐒🐒", "bye",
            "mb ney bye", "meww", "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘", "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏", "অ্যাসলামওয়ালিকুম",
            "কেমন আসো", "বলেন sir__😌", "বলেন ম্যাডাম__😌", "🙂🙂🙂", "𝗕𝗯𝘆 না জানু, বল 😌",
            "তোর বিয়ে হয় নি 𝗕𝗯𝘆 হইলো কিভাবে,,🙄", "বলো জানু 😒", "Meow🐤"
        ]
    });
}

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bbe", "babe", "sam"],
    version: "7.0.0",
    author: "AkHi",
    countDown: 0,
    role: 0,
    description: "Local cache based chat bot",
    category: "chat",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [Question] - [Reply] OR\nremove [Question] OR\nlist OR\nedit [Question] - [NewReply]"
    }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const { threadID, messageID, senderID } = event;
    const dipto = args.join(" ").toLowerCase();
    let data = fs.readJsonSync(path);

    try {
        // ১. সাধারণ মেসেজ রিপ্লাই (যখন শুধু !bby লিখবে)
        if (!args[0]) {
            const ran = ["Bolo baby", "hum", "ki go?", "type help bby"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], threadID, messageID);
        }

        // ২. রিমুভ কমান্ড
        if (args[0] === 'remove' || args[0] === 'rm') {
            const key = args.slice(1).join(" ").toLowerCase();
            if (data.responses[key]) {
                delete data.responses[key];
                fs.writeJsonSync(path, data);
                return api.sendMessage(`🗑️ | "${key}" এর সকল রিপ্লাই রিমুভ করা হয়েছে।`, threadID, messageID);
            }
            return api.sendMessage("❌ | এই নামে কোনো ডেটা নেই।", threadID, messageID);
        }

        // ৩. লিস্ট কমান্ড
        if (args[0] === 'list') {
            const totalQ = Object.keys(data.responses).length;
            const teachersList = Object.entries(data.teachers)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10);
            
            let msg = `❇️ | Total Questions: ${totalQ}\n👑 | Top Teachers:\n`;
            for (let [id, count] of teachersList) {
                const name = await usersData.getName(id) || id;
                msg += `• ${name}: ${count}\n`;
            }
            return api.sendMessage(msg, threadID, messageID);
        }

        // ৪. এডিট কমান্ড
        if (args[0] === 'edit') {
            const content = args.slice(1).join(" ").split(/\s*-\s*/);
            const ques = content[0]?.toLowerCase();
            const newAns = content[1];
            if (!ques || !newAns) return api.sendMessage("❌ | Format: edit [পুরানো কথা] - [নতুন কথা]", threadID, messageID);
            
            if (data.responses[ques]) {
                data.responses[ques] = [newAns];
                fs.writeJsonSync(path, data);
                return api.sendMessage(`✅ | "${ques}" এর উত্তর আপডেট করা হয়েছে।`, threadID, messageID);
            }
            return api.sendMessage("❌ | এই কথাটি আগে শেখানো হয়নি।", threadID, messageID);
        }

        // ৫. কথা শেখানো (Teach)
        if (args[0] === 'teach') {
            const content = args.slice(1).join(" ").split(/\s*-\s*/);
            const ques = content[0]?.toLowerCase();
            const ans = content[1];

            if (!ques || !ans) return api.sendMessage("❌ | Format: teach [কথা] - [রিপ্লাই]", threadID, messageID);

            if (!data.responses[ques]) data.responses[ques] = [];
            data.responses[ques].push(ans);

            // টিচার লিস্ট আপডেট
            data.teachers[senderID] = (data.teachers[senderID] || 0) + 1;

            fs.writeJsonSync(path, data);
            return api.sendMessage(`✅ | শিখে গেছি!\n🗣️ আপনি বললে: ${ques}\n🤖 আমি বলবো: ${ans}`, threadID, messageID);
        }

        // ৬. চ্যাটিং লজিক (কমান্ড দিয়ে কথা বলা)
        const response = data.responses[dipto] || data.randomReplies;
        const result = response[Math.floor(Math.random() * response.length)];
        
        return api.sendMessage(result, threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);

    } catch (e) {
        api.sendMessage("Error: " + e.message, threadID, messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if (event.senderID == api.getCurrentUserID()) return;
    let data = fs.readJsonSync(path);
    const body = event.body.toLowerCase();

    const response = data.responses[body] || data.randomReplies;
    const result = response[Math.floor(Math.random() * response.length)];

    api.sendMessage(result, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID
        });
    }, event.messageID);
};

module.exports.onChat = async ({ api, event }) => {
    const body = event.body ? event.body.toLowerCase() : "";
    const prefix = ["baby", "bby", "bot", "jan", "babu", "janu"];
    
    if (prefix.some(p => body.startsWith(p))) {
        let data = fs.readJsonSync(path);
        const input = body.replace(/^\S+\s*/, "").trim();
        
        let response;
        if (!input) {
            response = ["Bolo baby", "Janu dako keno?", "Hmm bolo kisu bolba?", "I am here!"];
        } else {
            response = data.responses[input] || data.randomReplies;
        }

        const result = response[Math.floor(Math.random() * response.length)];
        api.sendMessage(result, event.threadID, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                messageID: info.messageID,
                author: event.senderID
            });
        }, event.messageID);
    }
};
        
