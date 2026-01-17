const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "love",
    version: "2.7",
    author: "AkHi",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Create a love ship image of two users with special restrictions"
    },
    category: "fun",
    guide: {
      en: "{p}love @user1 @user2"
    }
  },

  onStart: async function ({ api, event, message }) {
    const { mentions, senderID } = event;
    const mentionIDs = Object.keys(mentions);

    // --- Special IDs Configuration ---
    const SPECIAL_ID_1 = "61586632438983"; // ID for Nawab
    const SPECIAL_ID_2 = "61586354826910";  // ID for Afruja AkHi
    // ---------------------------------

    let uid1, uid2;

    // Restriction Logic
    const isSpecial1 = (id) => id == SPECIAL_ID_1;
    const isSpecial2 = (id) => id == SPECIAL_ID_2;
    const isAnySpecial = (id) => isSpecial1(id) || isSpecial2(id);

    // 1. If any other user tries to mention Special IDs
    if (!isAnySpecial(senderID) && mentionIDs.some(id => isAnySpecial(id))) {
      return message.reply("⚠️ | Access Denied! You are not allowed to use this command with these private profiles.");
    }

    // 2. Logic for Special IDs (They are always paired)
    if (isAnySpecial(senderID)) {
      uid1 = SPECIAL_ID_1;
      uid2 = SPECIAL_ID_2;
    } 
    // 3. General Logic for normal users
    else {
      if (mentionIDs.length === 0) {
        return message.reply("❌ | Please mention at least one user or two users.");
      } else if (mentionIDs.length === 1) {
        uid1 = senderID;
        uid2 = mentionIDs[0];
      } else {
        uid1 = mentionIDs[0];
        uid2 = mentionIDs[1];
      }
    }

    try {
      const info1 = (await api.getUserInfo(uid1))[uid1];
      const info2 = (await api.getUserInfo(uid2))[uid2];
      const name1 = info1.name;
      const name2 = info2.name;

      const avatar1 = `https://graph.facebook.com/${uid1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatar2 = `https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
      const filePath = path.join(cachePath, `love_${uid1}_${uid2}.png`);

      message.reply("⏳ | Generating image, please wait...");

      try {
        const res = await axios.get(`https://canvas-api-beta.vercel.app/api/ship?avatar1=${encodeURIComponent(avatar1)}&avatar2=${encodeURIComponent(avatar2)}`, {
          responseType: "arraybuffer"
        });

        fs.writeFileSync(filePath, Buffer.from(res.data, "utf-8"));

        return message.reply({
          body: `💞 Bound by Love:\n${name1} ❤️ ${name2}`,
          attachment: fs.createReadStream(filePath)
        }, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

      } catch (err) {
        // Backup API
        const resBackup = await axios.get(`https://api.popcat.xyz/ship?user1=${avatar1}&user2=${avatar2}`, {
          responseType: "arraybuffer"
        });
        fs.writeFileSync(filePath, Buffer.from(resBackup.data, "utf-8"));
        return message.reply({
          body: `💞 Bound by Love:\n${name1} ❤️ ${name2}`,
          attachment: fs.createReadStream(filePath)
        }, () => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); });
      }

    } catch (e) {
      console.error(e);
      return message.reply("❌ | Error: Image generation failed or User not found.");
    }
  }
};
