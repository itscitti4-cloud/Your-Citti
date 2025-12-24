const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "whoami", "atake"],
    version: "1.2.0",
    role: 0,
    author: "AkHi",
    Description: "Get user information and statistics in a stylish format",
    category: "information",
    countDown: 10,
  },

  onStart: async function ({ event, usersData, api, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    let uid;
    if (args[0]) {
      if (/^\d+$/.test(args[0])) uid = args[0];
      else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }
    if (!uid) {
      uid = type === "message_reply" ? messageReply.senderID : (Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : senderID);
    }

    try {
      const userInfo = await api.getUserInfo(uid);
      const user = userInfo[uid];
      const userData = await usersData.get(uid) || {};

      // Gender Fix
      let genderText = "Unknown";
      if (user.gender === 1 || user.gender === "female") genderText = "Female";
      else if (user.gender === 2 || user.gender === "male") genderText = "Male";

      // Rank Calculation
      const allUser = await usersData.getAll();
      const rank = allUser.sort((a, b) => (b.exp || 0) - (a.exp || 0)).findIndex(u => u.userID === uid) + 1;

      // Stats Logic (যদি ডাটাবেজে থাকে, না থাকলে ০ দেখাবে)
      const stats = userData.data || {};
      const money = userData.money || 0;

      const userInformation = `╭───[ 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢 ]
├‣ 𝙽𝙰𝙼𝙴: ${user.name}
├‣ 𝙶𝙴𝙽𝙳𝙴𝚁: ${genderText.toUpperCase()}
├‣ 𝚄𝚂𝙴𝚁𝙽𝙰𝙼𝙴: ${user.vanity || "None"}
├‣ 𝙵𝚁𝙸𝙴𝙽𝙳 𝚆𝙸𝚃𝙷 𝙱𝙾𝚃: ${user.isFriend ? "𝚈𝙴𝚂✅" : "𝙽𝙾❎"}
├‣ 𝙽𝙸𝙲𝙺𝙽𝙰𝙼𝙴: ${(user.alternateName || "None").toUpperCase()}
├‣ 𝙲𝙻𝙰𝚂𝚂: ${user.type ? user.type.toUpperCase() : "𝙽𝙾𝚁𝙼𝙰𝙻🥺"}
├‣ 𝚁𝙰𝙽𝙺: #${rank}/${allUser.length}
├‣ 𝚅𝙸𝙿 𝚄𝚂𝙴𝚁: ${userData.isVip ? "𝚈𝙴𝚂✅" : "𝙽𝙾❎"}
╰‣ 𝚅𝙸𝙿 𝙴𝚇𝙿𝙸𝚁𝙴𝙳 𝙸𝙽: ${userData.vipTime || 0} Days

╭───[ 𝚄𝚂𝙴𝚁 𝚂𝚃𝙰𝚃𝚂 ]
├‣ 𝚂𝙻𝙾𝚃 𝚆𝙸𝙽𝚂: ${stats.slotWins || 0}
├‣ 𝙲𝚁𝙰𝚂𝙷 𝚆𝙸𝙽𝚂: ${stats.crashWins || 0}
├‣ 𝚂𝙸𝙲𝙱𝙾 𝚆𝙸𝙽𝚂: ${stats.sicboWins || 0}
├‣ 𝙼𝙸𝙽𝙴 𝚆𝙸𝙽𝚂: ${stats.mineWins || 0}
├‣ 𝙲𝙾𝙸𝙽𝙵𝙻𝙸𝙿 𝚆𝙸𝙽𝚂: ${stats.coinflipWins || 0}
├‣ 𝚀𝚄𝙸𝚉 𝚆𝙸𝙽𝚂: ${stats.quizWins || 0}
╰‣ 𝙼𝙾𝙽𝙴𝚈: $ ${formatMoney(money)}`;

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

function formatMoney(num) {
  const units = ["", "K", "M", "B", "T"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}
