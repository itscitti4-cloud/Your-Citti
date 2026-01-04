const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "whoami"],
    version: "2.3.0",
    role: 2, 
    author: "AkHi",
    Description: "Combined Teach stats from API and local database",
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

    const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    // API-তে সরাসরি mongoURI পাঠিয়ে ডেটা চাওয়া হচ্ছে
    const teachApiUrl = `https://baby-apisx.vercel.app/baby?list=all&db=${encodeURIComponent(mongoURI)}`;

    try {
      const [userInfo, userData, allUser] = await Promise.all([
        api.getUserInfo(uid).catch(() => ({ [uid]: {} })),
        usersData.get(uid),
        usersData.getAll()
      ]);

      const user = userInfo[uid] || {};
      const uData = userData || {};

      let apiTotalTeachs = 0;
      let apiUserTeachs = 0;

      // --- এপিআই থেকে ডেটা সংগ্রহ এবং ভেরিফিকেশন ---
      try {
        const response = await axios.get(teachApiUrl, { timeout: 15000 }); // ১৫ সেকেন্ড টাইমআউট
        let teachData = [];

        if (response.data) {
          if (Array.isArray(response.data)) {
            teachData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            teachData = response.data.data;
          } else if (typeof response.data === 'object') {
            // যদি এপিআই অবজেক্ট ফরম্যাটে ডেটা দেয়
            teachData = Object.values(response.data).filter(item => typeof item === 'object');
          }
        }

        apiTotalTeachs = teachData.length;
        apiUserTeachs = teachData.filter(item => {
          // ডেটাবেজে আইডি স্ট্রিং বা নাম্বার যেভাবেই থাকুক তা চেক করা
          const dbID = String(item.senderID || item.uid || item.user_id || "");
          return dbID === String(uid);
        }).length;

      } catch (err) {
        console.error("API Fetch Error: ", err.message);
      }

      // --- লোকাল ডেটাবেজ (usersData) থেকে টিচ কাউন্ট ---
      // যদি আপনার বট ফোল্ডারে টিচ ডাটা লোকাললি সেভ হয়
      const localUserTeachs = Number(uData.teachCount || 0);
      const localTotalTeachs = allUser.reduce((sum, u) => sum + Number(u.teachCount || 0), 0);

      // --- চূড়ান্ত যোগফল ---
      const totalCombined = apiTotalTeachs + localTotalTeachs;
      const userCombined = apiUserTeachs + localUserTeachs;

      // র‍্যাঙ্ক এবং অন্যান্য তথ্য
      const genderText = user.gender == 1 ? "FEMALE" : user.gender == 2 ? "MALE" : "UNKNOWN";
      const rank = allUser
        .sort((a, b) => (Number(b.exp) || 0) - (Number(a.exp) || 0))
        .findIndex(u => String(u.userID) === String(uid)) + 1;

      const d = uData.data || {};
      const money = uData.money || 0;

      const infoText = `╭───[ 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢 ]
├‣ 𝙽𝙰𝙼𝙴: ${user.name || "Unknown"}
├‣ 𝙶𝙴𝙽𝙳𝙴𝚁: ${genderText}
├‣ 𝙽𝙸𝙲𝙺𝙽𝙰𝙼𝙴: ${(user.alternateName || "NONE").toUpperCase()}
├‣ 𝚁𝙰𝙽𝙺: #${rank}/${allUser.length}
├‣ 𝚅𝙸𝙿 𝚄𝚂𝙴𝚁: ${uData.isVip ? "𝚈𝙴𝚂✅" : "𝙽𝙾❎"}
├‣ 𝚃𝙴𝙰𝙲𝙷: ${userCombined} / ${totalCombined}
╰‣ 𝙼𝙾𝙽𝙴𝚈: $${formatMoney(money)}

╭───[ 𝙶𝙰𝙼𝙴 𝚂𝚃𝙰𝚃𝚂 ]
├‣ 𝚂𝙻𝙾𝚃 𝚆𝙸𝙽𝚂: ${d.slotStats?.totalWins || 0}
├‣ 𝙲𝚁𝙰𝚂𝙷 𝚆𝙸𝙽𝚂: ${d.crashStats?.totalWins || 0}
├‣ 𝚂𝙸𝙲𝙱𝙾 𝚆𝙸𝙽𝚂: ${d.sicboStats?.totalWins || 0}
├‣ 𝙼𝙸𝙽𝙴 𝚆𝙸𝙽𝚂: ${d.mineStats?.totalWins || 0}
├‣ 𝙲𝙾𝙸𝙽𝙵𝙻𝙸𝙿 𝚆𝙸𝙽𝚂: ${d.coinflipStats?.totalWins || 0}
├‣ 𝚀𝚄𝙸𝚉 𝚆𝙸𝙽𝚂: ${d.quizStats?.totalWins || 0}
╰‣ 𝙵𝙻𝙰𝙶 𝚆𝙸𝙽𝚂: ${d.flagStats?.totalWins || 0}`;

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
              
