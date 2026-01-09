const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "whoami"],
    version: "3.0.0",
    role: 2,
    author: "AkHi / Nawab",
    Description: "Combined stats with Nawab API",
    category: "information",
    countDown: 5,
  },

  onStart: async function ({ event, usersData, api, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    let uid;
    if (args[0] && /^\d+$/.test(args[0])) uid = args[0];
    else if (type === "message_reply") uid = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) uid = Object.keys(mentions)[0];
    else uid = senderID;

    // --- আপনার API URL ---
    const nawabApiUrl = `https://nawab-api.onrender.com/api/bby`;

    try {
      const [userInfo, userData, allUser] = await Promise.all([
        api.getUserInfo(uid).catch(() => ({ [uid]: {} })),
        usersData.get(uid),
        usersData.getAll()
      ]);

      const user = userInfo[uid] || {};
      const uData = userData || {};
      
      // জেন্ডার ডিটেকশন ফিক্স
      let genderText = "UNKNOWN";
      if (user.gender === 1 || user.gender === "female") genderText = "FEMALE";
      else if (user.gender === 2 || user.gender === "male") genderText = "MALE";

      // --- ১. আপনার API থেকে টিচ ডেটা সংগ্রহ ---
      let totalTeachs = 0;
      let userTeachs = 0;

      try {
        // টোটাল টিচ কাউন্ট ফেচ
        const totalRes = await axios.get(`${nawabApiUrl}/total`);
        totalTeachs = totalRes.data.total_commands || 0;

        // ইউজারের টিচ কাউন্ট ফেচ (list এন্ডপয়েন্ট থেকে)
        const listRes = await axios.get(`${nawabApiUrl}/list`);
        const teachers = listRes.data.teachers || [];
        
        // ইউজারের নাম দিয়ে ডাটাবেজে খোঁজা হচ্ছে
        const teacherStats = teachers.find(t => 
            t.teacher_name.toLowerCase() === user.name.toLowerCase()
        );
        userTeachs = teacherStats ? teacherStats.teach_count : 0;
      } catch (e) { 
        console.log("Nawab API Fetch Failed: " + e.message); 
      }

      // র‍্যাঙ্ক ক্যালকুলেশন
      const rank = allUser
        .sort((a, b) => (Number(b.exp) || 0) - (Number(a.exp) || 0))
        .findIndex(u => String(u.userID) === String(uid)) + 1;

      const d = uData.data || {};
      const infoText = `╭───[ 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢 ]
├‣ 𝙽𝙰𝙼𝙴: ${user.name || "Unknown"}
├‣ 𝙶𝙴𝙽𝙳𝙴𝚁: ${genderText}
├‣ 𝙽𝙸𝙲𝙺𝙽𝙰𝙼𝙴: ${(user.alternateName || "NONE").toUpperCase()}
├‣ 𝚁𝙰𝙽𝙺: #${rank}/${allUser.length}
├‣ 𝚅𝙸𝙿 𝚄𝚂𝙴𝚁: ${uData.isVip ? "𝚈𝙴𝚂✅" : "𝙽𝙾❎"}
├‣ 𝚃𝙴𝙰𝙲𝙷: ${userTeachs} / ${totalTeachs}
╰‣ 𝙼𝙾𝙽𝙴𝚈: $${formatMoney(uData.money || 0)}

╭───[ 𝙶𝙰𝙼𝙴 𝚂𝚃𝙰𝚃𝚂 ]
├‣ 𝙲𝙾𝙸𝙽𝙵𝙻𝙸𝙿 𝚆𝙸𝙽𝚂: ${d.coinflipStats?.totalWins || 0}
├‣ 𝙲𝚁𝙰𝚂𝙷 𝚆𝙸𝙽𝚂: ${d.crashStats?.totalWins || 0}
├‣ 𝙵𝙻𝙰𝙶 𝚆𝙸𝙽𝚂: ${d.flagStats?.totalWins || 0}
├‣ 𝙼𝙸𝙽𝙴 𝚆𝙸𝙽𝚂: ${d.mineStats?.totalWins || 0}
├‣ 𝚀𝚄𝙸𝚉 𝚆𝙸𝙽𝚂: ${d.quizStats?.totalWins || 0}
├‣ 𝚂𝙸𝙲𝙱𝙾 𝚆𝙸𝙽𝚂: ${d.sicboStats?.totalWins || 0}
╰‣ 𝚂𝙻𝙾𝚃 𝚆𝙸𝙽𝚂: ${d.slotStats?.totalWins || 0}`;

      let attachment;
      try {
        const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        attachment = (await axios.get(avatarUrl, { responseType: "stream" })).data;
      } catch (e) { attachment = null; }

      return api.sendMessage({ body: infoText, attachment }, threadID, messageID);

    } catch (err) {
      return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
  }
};

function formatMoney(n) {
  if (n < 1000) return n;
  const units = ["K", "M", "B", "T"];
  let i = -1;
  while (n >= 1000 && ++i < units.length) n /= 1000;
  return n.toFixed(1).replace(/\.0$/, "") + units[i];
}
