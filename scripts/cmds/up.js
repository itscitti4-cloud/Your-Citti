const os = require('os');

function formatDuration(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    let parts = [];
    if (d > 0) parts.push(`${d} 𝗱𝗮𝘆𝘀`);
    if (h > 0) parts.push(`${h} 𝗵𝗼𝘂𝗿𝘀`);
    if (m > 0) parts.push(`${m} 𝗺𝗶𝗻𝘂𝘁𝗲𝘀`);
    if (s > 0 || parts.length === 0) parts.push(`${s} 𝘀𝗲𝗰𝗼𝗻𝗱𝘀`);

    return parts.join(' ');
}

module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "up", "runtime"],
    version: "1.5",
    author: "AkHi",
    countDown: 5,
    role: 0,
    category: "system",
    guide: { en: "{pn}" }
  },

  onStart: async function({ api, message, event, threadsData, usersData }) {
    try {
      // সিস্টেম ও প্রসেস আপটাইম
      const systemUptime = formatDuration(os.uptime());
      const processUptime = formatDuration(process.uptime());

      // মেমোরি ক্যালকুলেশন
      const totalMemory = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
      const freeMemory = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
      const usedMemory = (totalMemory - freeMemory).toFixed(2);

      // ইউজার এবং থ্রেড সংখ্যা লাইভ ডাটাবেস থেকে সংগ্রহ
      // GoatBot এ সব ইউজার এবং থ্রেড এর ID পেতে getAll ব্যবহার করা হয়
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();

      const totalUsers = allUsers.length.toString(); 
      const totalThreads = allThreads.length.toString();

      const msg = 
        `╭──✦ [ 𝗨𝗽𝘁𝗶𝗺𝗲 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻 ]\n` +
        `├‣ 🕒 𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝗽𝘁𝗶𝗺𝗲: ${systemUptime}\n` +
        `╰‣ ⏱ 𝗣𝗿𝗼𝗰𝗲𝘀𝘀 𝗨𝗽𝘁𝗶𝗺𝗲: ${processUptime}\n\n` +
        `╭──✦ [ 𝗦𝘆𝘀𝘁𝗲𝗺 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻 ]\n` +
        `├‣ 📡 𝗢𝗦: 𝗟𝗶𝗻𝘂𝘅 ${os.release()}\n` +
        `├‣ 🛡 𝗖𝗼𝗿𝗲𝘀: ${os.cpus().length}\n` +
        `├‣ 🔍 𝗔𝗿𝗰𝗵𝗶𝘁𝗲𝗰𝘁𝘂𝗿𝗲: ${os.arch()}\n` +
        `├‣ 🖥 𝗡𝗼𝗱𝗲 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${process.version}\n` +
        `├‣ 📈 𝗧𝗼𝘁𝗮𝗹 𝗠𝗲𝗺𝗼𝗿𝘆: ${totalMemory} 𝗚𝗕\n` +
        `├‣ 📉 𝗙𝗿𝗲𝗲 𝗠𝗲𝗺𝗼𝗿𝘆: ${freeMemory} 𝗚𝗕\n` +
        `├‣ 📊 𝗥𝗔𝗠 𝗨𝘀𝗮𝗴𝗲: ${usedMemory} 𝗚𝗕\n` +
        `├‣ 👥 𝗧𝗼𝘁𝗮𝗹 𝗨𝘀𝗲𝗿𝘀: ${totalUsers} 𝗺𝗲𝗺𝗯𝗲𝗿𝘀\n` +
        `├‣ 📂 𝗧𝗼𝘁𝗮𝗹 𝗧𝗵𝗿𝗲𝗮𝗱𝘀: ${totalThreads} 𝗚𝗿𝗼𝘂𝗽𝘀\n` +
        `╰‣ ♻ 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿: 𝗡𝗔𝗪𝗔𝗕 𝗮𝗻𝗱 𝗔𝗸𝗛𝗶`;

      return message.reply(msg);
    } catch (e) {
      console.log(e);
      return message.reply("কমান্ডটি চালানোর সময় ডাটাবেস সংযোগে সমস্যা হয়েছে।");
    }
  }
};
