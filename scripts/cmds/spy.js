const axios = require("axios");
const { MongoClient } = require("mongodb");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "whoami"],
    version: "2.9.0",
    role: 2,
    author: "AkHi",
    Description: "Combined stats with MongoDB Gender Detection",
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

    const teachApiUrl = `https://baby-apisx.vercel.app/baby?list=all`;
    const mongoURI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    const dbName = "test";

    try {
      const [userInfo, userData, allUser] = await Promise.all([
        api.getUserInfo(uid).catch(() => ({ [uid]: {} })),
        usersData.get(uid),
        usersData.getAll()
      ]);

      const user = userInfo[uid] || {};
      const uData = userData || {};
      let mongoGender = "UNKNOWN";

      // --- ১. এপিআই থেকে ডেটা সংগ্রহ ---
      let apiTotal = 0, apiUser = 0;
      try {
        const res = await axios.get(teachApiUrl);
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        apiTotal = data.length;
        apiUser = data.filter(item => String(item.senderID || item.uid) === String(uid)).length;
      } catch (e) { console.log("API Fetch Failed"); }

      // --- ২. মঙ্গোডিবি থেকে জেন্ডার এবং টিচ ডেটা সংগ্রহ ---
      let mongoTotal = 0, mongoUser = 0;
      let client;
      try {
        client = new MongoClient(mongoURI);
        await client.connect();
        const db = client.db(dbName);
        
        // জেন্ডার শনাক্ত করার জন্য 'users' কালেকশন ব্যবহার
        const userCollection = db.collection("users");
        const dbUser = await userCollection.findOne({ 
          $or: [{ userID: String(uid) }, { uid: String(uid) }] 
        });

        if (dbUser && dbUser.gender) {
            // ১ = Female, ২ = Male (সাধারণত মঙ্গোডিবি ফরম্যাট অনুযায়ী)
            mongoGender = dbUser.gender == 1 ? "FEMALE" : dbUser.gender == 2 ? "MALE" : "UNKNOWN";
        } else {
            // যদি মঙ্গোডিবিতে না পায় তবে ফেসবুক প্রোফাইল থেকে নিবে
            mongoGender = user.gender == 1 ? "FEMALE" : user.gender == 2 ? "MALE" : "UNKNOWN";
        }

        // টিচ কাউন্টের জন্য 'babies' কালেকশন ব্যবহার
        const babyCollection = db.collection("babies");
        mongoTotal = await babyCollection.countDocuments({});
        mongoUser = await babyCollection.countDocuments({ 
          $or: [{ senderID: String(uid) }, { uid: String(uid) }] 
        });

      } catch (e) { 
        console.log("MongoDB Error: " + e.message);
        mongoGender = user.gender == 1 ? "FEMALE" : user.gender == 2 ? "MALE" : "UNKNOWN";
      } finally {
        if (client) await client.close();
      }

      // --- ৩. চূড়ান্ত যোগফল ---
      const combinedUserTeachs = apiUser + mongoUser;
      const combinedTotalTeachs = apiTotal + mongoTotal;

      const rank = allUser
        .sort((a, b) => (Number(b.exp) || 0) - (Number(a.exp) || 0))
        .findIndex(u => String(u.userID) === String(uid)) + 1;

      const d = uData.data || {};
      const infoText = `╭───[ 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢 ]
├‣ 𝙽𝙰𝙼𝙴: ${user.name || "Unknown"}
├‣ 𝙶𝙴𝙽𝙳𝙴𝚁: ${mongoGender}
├‣ 𝙽𝙸𝙲𝙺𝙽𝙰𝙼𝙴: ${(user.alternateName || "NONE").toUpperCase()}
├‣ 𝚁𝙰𝙽𝙺: #${rank}/${allUser.length}
├‣ 𝚅𝙸𝙿 𝚄𝚂𝙴𝚁: ${uData.isVip ? "𝚈𝙴𝚂✅" : "𝙽𝙾❎"}
├‣ 𝚃𝙴𝙰𝙲𝙷: ${combinedUserTeachs} / ${combinedTotalTeachs}
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
