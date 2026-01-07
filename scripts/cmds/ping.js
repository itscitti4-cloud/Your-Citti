const os = require('os');

module.exports = {
  config: {
    name: "ping",
    version: "2.6.0",
    author: "Nawab & AkHi",
    countDown: 5,
    role: 0,
    description: "Check bot's speed and real system status.",
    category: "system",
    guide: {
      en: "{p}ping"
    }
  },

  onStart: async function ({ api, event }) {
    const startTime = Date.now();
    
    // প্রাথমিক মেসেজ পাঠানো
    const pingMsg = await api.sendMessage("🛰️ Checking bot latency...", event.threadID);

    const endTime = Date.now();
    const latency = endTime - startTime;

    // সিস্টেম মেমরি (পুরো সার্ভারের র‍্যাম)
    const totalMemory = (os.totalmem() / (1024 ** 3)).toFixed(2); // GB
    const freeMemory = (os.freemem() / (1024 ** 3)).toFixed(2);   // GB
    const usedMemory = (totalMemory - freeMemory).toFixed(2);     // GB

    // আপটাইম ক্যালকুলেশন
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const msg = `
╭━━━〔 𝗣𝗜𝗡𝗚 𝗦𝗧𝗔𝗧𝗨𝗦 〕━━━🌀
┃
┃ 🚀 𝗟𝗮𝘁𝗲𝗻𝗰𝘆: ${latency}ms
┃ 🕒 𝗨𝗽𝘁𝗶𝗺𝗲: ${hours}h ${minutes}m ${seconds}s
┃ 🖥️ 𝗥𝗔𝗠 𝗨𝘀𝗮𝗴𝗲: ${usedMemory} GB / ${totalMemory} GB
┃ 📡 𝗦𝘁𝗮𝘁𝘂𝘀: 🟢 ONLINE
┃
╰━━━━━━━━━━━━━━━━━━━╯
╭━━━〔 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 〕━━━🌟
┃
┃ 🙎🏻 Shahryar Sabu
┃ 🙎🏻‍♀️ Lubna Jannat
┃
╰━━━━━━━━━━━━━━━━━━━╯`;

    return api.editMessage(msg, pingMsg.messageID);
  }
};
