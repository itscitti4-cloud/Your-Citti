const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "whoami"],
    version: "2.1.9",
    role: 2, 
    author: "AkHi",
    Description: "Get user information and statistics including actual Teach counts",
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

    // সংশোধন: সরাসরি স্ট্রিং ব্যবহার করুন, axios নিজেই এনকোড করে নেবে
    const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    const teachApiUrl = `https://baby-apisx.vercel.app/baby?list=all&db=${encodeURIComponent(mongoURI)}`;

    try {
      const [userInfo, userData, allUser] = await Promise.all([
        api.getUserInfo(uid),
        usersData.get(uid),
        usersData.getAll()
      ]);

      const user = userInfo[uid] || {};
      const uData = userData || {};

      let totalTeachs = 0;
      let userTeachs = 0;

      try {
        const res = await axios.get(teachApiUrl);
        // সংশোধন: এপিআই ডাটা চেক লজিক
        let teachData = [];
        if (Array.isArray(res.data)) {
            teachData = res.data;
        } else if (res.data && Array.isArray(res.data.data)) {
            teachData = res.data.data;
        } else if (typeof res.data === 'object') {
            // যদি অবজেক্ট আকারে আসে (যেমন কী-ভ্যালু পেয়ার)
            teachData = Object.values(res.data).filter(item => typeof item === 'object');
        }

        if (teachData.length > 0) {
          totalTeachs = teachData.length;
          // ইউজার আইডি চেক
          userTeachs = teachData.filter(item => 
            String(item.senderID) === String(uid) || String(item.uid) === String(uid)
          ).length;
        }
      } catch (err) {
        console.error("Teach API Error:", err.message);
      }

      let genderText = user.gender == 1 ? "FEMALE" : user.gender == 2 ? "MALE" : "UNKNOWN";

      const rank = allUser
        .sort((a, b) => (Number(b.exp) || 0) - (Number(a.exp) || 0))
        .findIndex(u => String(u.userID) === String(uid)) + 1;

      const d = uData.data || {};
      const stats = {
        slot: d.slotStats?.totalWins || 0,
        crash: d.crashStats?.totalWins || 0,
        sicbo: d.sicboStats?.totalWins || 0,
        mine: d.mineStats?.totalWins || 0,
        coin: d.coinflipStats?.totalWins || 0,
        quiz: d.quizStats?.totalWins || 0,
        flag: d.flagStats?.totalWins || 0
      };

      const money = uData.money || 0;
      const nickname = user.alternateName || "NONE";

      const userInformation = `╭───[ 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢 ]
├‣ 𝙽𝙰𝙼𝙴: ${user.name || "Unknown"}
├‣ 𝙶𝙴𝙽𝙳𝙴𝚁: ${genderText}
├‣ 𝙽𝙸𝙲𝙺𝙽𝙰𝙼𝙴: ${nickname.toUpperCase()}
├‣ 𝚁𝙰𝙽𝙺: #${rank}/${allUser.length}
├‣ 𝚅𝙸𝙿 𝚄𝚂𝙴𝚁: ${uData.isVip ? "𝚈𝙴𝚂✅" : "𝙽𝙾❎"}
├‣ 𝚃𝙴𝙰𝙲𝙷: ${userTeachs} / ${totalTeachs}
╰‣ 𝙼𝙾𝙽𝙴𝚈: $${formatMoney(money)}

╭───[ 𝙶𝙰𝙼𝙴 𝚂𝚃𝙰𝚃𝚂 ]
├‣ 𝚂𝙻𝙾𝚃 𝚆𝙸𝙽𝚂: ${stats.slot}
├‣ 𝙲𝚁𝙰𝚂𝙷 𝚆𝙸𝙽𝚂: ${stats.crash}
├‣ 𝚂𝙸𝙲𝙱𝙾 𝚆𝙸𝙽𝚂: ${stats.sicbo}
├‣ 𝙼𝙸𝙽𝙴 𝚆𝙸𝙽𝚂: ${stats.mine}
├‣ 𝙲𝙾𝙸𝙽𝙵𝙻𝙸𝙿 𝚆𝙸𝙽𝚂: ${stats.coin}
├‣ 𝚀𝚄𝙸𝚉 𝚆𝙸𝙽𝚂: ${stats.quiz}
╰‣ 𝙵𝙻𝙰𝙶 𝚆𝙸𝙽𝚂: ${stats.flag}`;

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
