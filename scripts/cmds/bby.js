const fs = require('fs-extra');
const path = require('path');

// ফোল্ডার এবং ফাইল পাথ ঠিক করা (Render এর জন্য নিরাপদ উপায়)
const cacheDir = path.join(__dirname, "cache");
const filePath = path.join(cacheDir, "babyData.json");

// ফোল্ডার এবং ফাইল অটোমেটিক তৈরি করার লজিক
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

if (!fs.existsSync(filePath)) {
    const initialData = {
        responses: {},
        teachers: {},
        randomReplies: [
            "babu khuda lagse🥺", "Hop beda😾", "আমাকে ডাকলে ,আমি কিন্তূ কিস করে দেবো😘 ", "🐒🐒🐒", "bye",
            "mb ney bye", "meww", "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘", "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏", "অ্যাসলামওয়ালিকুম",
            "কেমন আসো", "বলেন sir__😌", "বলেন ম্যাডাম__😌", "🙂🙂🙂", "𝗕𝗯𝘆 না জানু, বল 😌",
            "তোর বিয়ে হয় নি 𝗕𝗯𝘆 হইলো কিভাবে,,🙄", "বলো জানু 😒", "Meow🐤"
        ]
    };
    fs.writeJsonSync(filePath, initialData);
}

module.exports.config = {
    name: "bby",
    aliases: ["baby", "hinata", "babe", "citti"],
    version: "7.0.1",
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
    let data = fs.readJsonSync(filePath);

    try {
        if (!args[0]) {
            const ran = ["Bolo baby", "hum", "ki go?", "type help bby"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], threadID, messageID);
        }

        if (args[0] === 'remove' || args[0] === 'rm') {
            const key = args.slice(1).join(" ").toLowerCase();
            if (data.responses[key]) {
                delete data.responses[key];
                fs.writeJsonSync(filePath, data);
                return api.sendMessage(`🗑️ | "${key}" এর সকল রিপ্লাই রিমুভ করা হয়েছে।`, threadID, messageID);
            }
            return api.sendMessage("❌ | এই নামে কোনো ডেটা নেই।", threadID, messageID);
        }

        if (args[0] === 'list') {
            const totalQ = Object.keys(data.responses).length;
            const teachersList = Object.entries(data.teachers)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10);
            
            let msg = `❇️ | Total Questions: ${totalQ}\n👑 | Top Teachers:\n`;
            for (let [id, count] of teachersList) {
                let name;
                try { name = await usersData.getName(id); } catch(e) { name = id; }
                msg += `• ${name}: ${count}\n`;
            }
            return api.sendMessage(msg, threadID, messageID);
        }

        if (args[0] === 'edit') {
            const content = args.slice(1).join(" ").split(/\s*-\s*/);
            const ques = content[0]?.toLowerCase();
            const newAns = content[1];
            if (!ques || !newAns) return api.sendMessage("❌ | Format: edit [পুরানো কথা] - [নতুন কথা]", threadID, messageID);
            
            if (data.responses[ques]) {
                data.responses[ques] = [newAns];
                fs.writeJsonSync(filePath, data);
                return api.sendMessage(`✅ | "${ques}" এর উত্তর আপডেট করা হয়েছে।`, threadID, messageID);
            }
            return api.sendMessage("❌ | এই কথাটি আগে শেখানো হয়নি।", threadID, messageID);
        }

        if (args[0] === 'teach') {
            const content = args.slice(1).join(" ").split(/\s*-\s*/);
            const ques = content[0]?.toLowerCase();
            const ans = content[1];

            if (!ques || !ans) return api.sendMessage("❌ | Format: teach [কথা] - [রিপ্লাই]", threadID, messageID);

            if (!data.responses[ques]) data.responses[ques] = [];
            data.responses[ques].push(ans);
            data.teachers[senderID] = (data.teachers[senderID] || 0) + 1;

            fs.writeJsonSync(filePath, data);
            return api.sendMessage(`✅ | AkHi Ma'am শিখে গেছি!\n🗣️ আপনি বললে: ${ques}\n🤖 আমি বলবো: ${ans}`, threadID, messageID);
        }

        const response = data.responses[dipto] || data.randomReplies;
        const result = response[Math.floor(Math.random() * response.length)];
        
        return api.sendMessage(result, threadID, (error, info) => {
            if (!error) global.GoatBot.onReply.set(info.messageID, {
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
    let data = fs.readJsonSync(filePath);
    const body = event.body.toLowerCase();
    const response = data.responses[body] || data.randomReplies;
    const result = response[Math.floor(Math.random() * response.length)];

    api.sendMessage(result, event.threadID, (err, info) => {
        if (!err) global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID
        });
    }, event.messageID);
};
          
