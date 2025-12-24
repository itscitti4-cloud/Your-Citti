const axios = require("axios");
const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`,
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "admininfo",
    aliases: ["adinfo", "botinfo", "info", "adminke"],
    version: "1.0",
    role: 0,
    author: "AkHi",
    Description: "Get user information and profile photo",
    category: "information",
    countDown: 10,
  },

  onStart: async function ({
    event,
    message,
    usersData,
    api,
    args,
  }) {
    const uid1 = event.senderID;

    const uid2 = Object.keys(event.mentions)[0];
    let uid;

    if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) {
          uid = match[1];
        }
      }
    }

    if (!uid) {
      uid =
        event.type === "message_reply"
          ? event.messageReply.senderID
          : uid2 || uid1;
    }
    const response = await require("axios").get(
      `${await baseApiUrl()}/baby?list=all`
    );
    const dataa = response.data || { teacher: { teacherList: [] } };
    let babyTeach = 0;

    if (dataa?.teacher?.teacherList?.length) {
      babyTeach = dataa.teacher.teacherList.find((t) => t[uid])?.[uid] || 0;
    }

    const userInfo = await api.getUserInfo(uid);
    const avatarUrl = `https://graph.facebook.com/61583939430347/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    let genderText;
    switch (userInfo[uid].gender) {
      case 1:
        genderText = "Female";
        break;
      case 2:
        genderText = "Male";
        break;
      default:
        genderText = "Hided";
    }

    const money = (await usersData.get(uid)).money;
    const allUser = await usersData.getAll(), rank = allUser.slice().sort((a, b) => b.exp - a.exp).findIndex(user => user.userID === uid) + 1, moneyRank = allUser.slice().sort((a, b) => b.money - a.money).findIndex(user => user.userID === uid) + 1;

    const position = userInfo[uid].type;

    const userInformation = `
╭────[ BOT ADMIN INFO ]
├‣ 𝙽𝚊𝚖𝚎: Lubna Jannat
├‣ 𝙶𝚎𝚗𝚍𝚎𝚛: Female
├‣ 𝚄𝙸𝙳: 61583939430347
├‣ 𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎: LubnaaJannat.AkHi
├‣ FB: facebook.com/LubnaaJannat.AkHi
├‣ 𝙱𝚒𝚛𝚝𝚑𝚍𝚊𝚢: 27 October
├‣ 𝙽𝚒𝚌𝚔𝙽𝚊𝚖𝚎: AkHi
├‣ Status: Married
├‣ Husband: Shahryar Sabu
├‣ Weeding date: 20 February, 2025
├‣ Profession: Teacher
├‣ Study: BBA Honours 
├‣ Institute: University of Dhaka
├‣ Lives in : Lalbagh, Dhaka
╰‣ From : Bhandaria, Pirojpur, Barishal`;
const avatarStream = (await require("axios").get(avatarUrl, { responseType: "stream" })).data;
   api.sendMessage({
      body: userInformation,
      attachment: avatarStream,
    }, event.threadID, event.messageID);
  },
};

function formatMoney(num) {
  const units = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "D"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
                                                                                                                                                                                                                       }
