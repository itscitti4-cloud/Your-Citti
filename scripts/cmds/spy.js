const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "whoami"],
    version: "2.1.0",
    role: 2, // সবার জন্য উন্মুক্ত রাখতে ০ দিন
    author: "AkHi",
    Description: "Get user information and statistics including Teach counts",
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

    const mongoURI = encodeURIComponent("mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    const teachApiUrl = `https://baby-apisx.vercel.app/baby?list=all&senderID=${uid}&db=${mongoURI}`;

    try {
      // ইউজারের প্রোফাইল এবং ডাটাবেস তথ্য সংগ্রহ
      const userInfo = await api.getUserInfo(uid);
      const user = userInfo[uid] || {};
      const userData = await usersData.get(uid) || {};
      const allUser = await usersData.getAll();

      // এপিআই থেকে টিচ ডাটা সংগ্রহ
      let totalTeachs = 0;
      let userTeachs = 0;
      try {
        const res = await axios.get(teachApiUrl);
        totalTeachs = res.data.length || 0; // মোট কতগুলো টিচ আছে
        // আপনার এপিআই যদি কন্ট্রিবিউটর লিস্ট দেয় তবে সেখান থেকে ইউজারের টিচ বের করা
        // আপাতত এপিআই রেসপন্স অনুযায়ী এটি হ্যান্ডেল করা হচ্ছে
        userTeachs = res.data.userTeachs || 0; 
      } catch (err) {
        console.error("Teach API Error:", err);
      }

      // ১. Gender logic
      let genderText = "UNKNOWN";
      if (user.gender == 1) genderText = "FEMALE";
      else if (user.gender == 2) genderText = "MALE";

      // ২. Rank calculation
      const rank = allUser.sort((a, b) => (Number(b.exp) || 0) - (Number(a.exp) || 0)).findIndex(u => u.userID === uid) + 1;

      // ৩. ডাটাবেস থেকে স্ট্যাটাস ম্যাপিং
      const d = userData.data || {};
      const slotWins = d.slotStats ? d.slotStats.totalWins : 0;
      const crashWins = d.crashStats ? d.crashStats.totalWins : 0;
      const sicboWins = d.sicboStats ? d.sicboStats.totalWins : 0;
      const mineWins = d.mineStats ? d.mineStats.totalWins : 0;
      const coinWins = d.coinflipStats ? d.coinflipStats.totalWins : 0;
      const quizWins = d.quizStats ? d.quizStats.totalWins : 0;
      const flagWins = d.flagStats ? d.flagStats.totalWins : 0;
      const money = userData.money || 0;
      const nickname = user.alternateName || "NONE";

      const userInformation = `╭───[ 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢 ]
├‣ 𝙽𝙰𝙼𝙴: ${user.name || "Unknown"}
├‣ 𝙶𝙴𝙽𝙳𝙴𝚁: ${genderText}
├‣ 𝙽𝙸𝙲𝙺𝙽𝙰𝙼𝙴: ${nickname.toUpperCase()}
├‣ 𝚁𝙰𝙽𝙺: #${rank}/${allUser.length}
├‣ 𝚅𝙸𝙿 𝚄𝚂𝙴𝚁: ${userData.isVip ? "𝚈𝙴𝚂✅" : "𝙽𝙾❎"}
├‣ 𝚃𝙴𝙰𝙲𝙷: ${userTeachs} / ${totalTeachs}
╰‣ 𝙼𝙾𝙽𝙴𝚈: $${formatMoney(money)}

╭───[ 𝙶𝙰𝙼𝙴 𝚂𝚃𝙰𝚃𝚂 ]
├‣ 𝚂𝙻𝙾𝚃 𝚆𝙸𝙽𝚂: ${slotWins}
├‣ 𝙲𝚁𝙰𝚂𝙷 𝚆𝙸𝙽𝚂: ${crashWins}
├‣ 𝚂𝙸𝙲𝙱𝙾 𝚆𝙸𝙽𝚂: ${sicboWins}
├‣ 𝙼𝙸𝙽𝙴 𝚆𝙸𝙽𝚂: ${mineWins}
├‣ 𝙲𝙾𝙸𝙽𝙵𝙻𝙸𝙿 𝚆𝙸𝙽𝚂: ${coinWins}
├‣ 𝚀𝚄𝙸𝚉 𝚆𝙸𝙽𝚂: ${quizWins}
╰‣ 𝙵𝙻𝙰𝙶 𝚆𝙸𝙽𝚂: ${flagWins}`;

      const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarStream = (await axios.get(avatarUrl, { responseType: "stream" })).data;

      return api.sendMessage({
        body: userInformation,
        attachment: avatarStream,
      }, threadID, messageID);

    } catch (err) {
      return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
  },
};

function formatMoney(n) {
  if (n < 1000) return n;
  const units = ["K", "M", "B", "T"];
  let i = -1;
  while (n >= 1000 && ++i < units.length) n /= 1000;
  return n.toFixed(1).replace(/\.0$/, "") + units[i];
}
