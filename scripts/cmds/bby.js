const fs = require('fs-extra');
const path = require('path');

const cacheDir = path.join(__dirname, "cache");
const filePath = path.join(cacheDir, "babyData.json");

if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

if (!fs.existsSync(filePath)) {
    const initialData = {
        responses: {},
        teachers: {},
        randomReplies: [
            "babu khuda lagse🥺", "Hop beda😾", "আমাকে ডাকলে, আমি কিন্তু কিস করে দেবো😘", "🐒🐒🐒", "bye",
            "mb ney bye", "meww", "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘", "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏", "অ্যাসলামওয়ালিকুম",
            "কেমন আছো?", "বলেন sir__😌", "বলেন ম্যাডাম__😌", "🙂🙂🙂", "𝗕𝗯𝘆 না জানু, বল 😌",
            "তোর বিয়ে হয় নি 𝗕𝗯𝘆 হইলো কিভাবে,,🙄", "বলো জানু 😒", "Meow🐤"
        ]
    };
    fs.writeJsonSync(filePath, initialData);
}

module.exports.config = {
    name: "bby",
    aliases: ["baby", "hinata", "babe", "citti"],
    version: "7.1.0",
    author: "AkHi",
    countDown: 0,
    role: 0,
    description: "Prefix for teach/admin, No-Prefix for chatting",
    category: "chat",
    guide: {
        en: "Prefix Commands:\n{pn} teach [Q
            
