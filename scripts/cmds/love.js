const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "love",
    version: "4.0",
    author: "AkHi",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Advanced love ship with mention, reply, and UID support"
    },
    category: "fun",
    guide: {
      en: "{p}love [@mention/reply/UID]"
    }
  },

  onStart: async function ({ api, event, message, args }) {
    const { mentions, senderID, messageID, type, messageReply } = event;

    const SPECIAL_ID_1 = "61586632438983"; 
    const SPECIAL_ID_2 = "61586354826910";  

    let uid1, uid2;

    // --- ID Extraction Logic ---
    const mentionIDs = Object.keys(mentions);
    
    // ১. মেনশন ২ জন থাকলে
    if (mentionIDs.length >= 2) {
      uid1 = mentionIDs[0];
      uid2 = mentionIDs[1];
    }
    // ২. ২ টি UID সরাসরি দিলে
    else if (args.length >= 2 && !isNaN(args[0]) && !isNaN(args[1])) {
      uid1 = args[0];
      uid2 = args[1];
    }
    // ৩. রিপ্লাই এর সাথে মেনশন থাকলে
    else if (type === "message_reply" && mentionIDs.length >= 1) {
      uid1 = messageReply.senderID;
      uid2 = mentionIDs[0];
    }
    // ৪. শুধু রিপ্লাই থাকলে
    else if (type === "message_reply") {
      uid1 = senderID;
      uid2 = messageReply.senderID;
    }
    // ৫. ১টি মেনশন থাকলে
    else if (mentionIDs.length === 1) {
      uid1 = senderID;
      uid2 = mentionIDs[0];
    }
    // ৬. ১টি UID সরাসরি দিলে
    else if (args.length === 1 && !isNaN(args[0])) {
      uid1 = senderID;
      uid2 = args[0];
    }
    // ৭. কিছুই না থাকলে
    else {
      uid1 = senderID;
      // স্পেশাল পার্সনদের জন্য অটো পেয়ারিং
      if (senderID == SPECIAL_ID_1 || senderID == SPECIAL_ID_2) {
        uid1 = SPECIAL_ID_1;
        uid2 = SPECIAL_ID_2;
      } else {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply("❌ | Please mention a user, reply to a message, or provide a UID.");
      }
    }

    // --- Restriction Logic ---
    const isAnySpecial = (id) => id == SPECIAL_ID_1 || id == SPECIAL_ID_2;

    if (!isAnySpecial(senderID) && (isAnySpecial(uid1) || isAnySpecial(uid2))) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply("⚠️ | Access Denied! You are not allowed to use this command with these private profiles.");
    }

    // স্পেশাল পার্সন যে কাউকে কমান্ড দিক, তারা সব সময় নিজেদের সাথেই পেয়ার হবে
    if (isAnySpecial(senderID)) {
      uid1 = SPECIAL_ID_1;
      uid2 = SPECIAL_ID_2;
    }

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const info1 = (await api.getUserInfo(uid1))[uid1];
      const info2 = (await api.getUserInfo(uid2))[uid2];
      
      if (!info1 || !info2) throw new Error("User info not found");

      const name1 = info1.name;
      const name2 = info2.name;

      message.reply("⏳ | Generating image, please wait...");

      const bgPath = path.join(__dirname, "assets", "image", "IMG_20260117_155148.jpg");
      if (!fs.existsSync(bgPath)) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply("❌ | Background image not found in assets folder.");
      }

      const background = await loadImage(bgPath);
      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      const avatar1Url = `https://graph.facebook.com/${uid1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatar2Url = `https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const [img1, img2] = await Promise.all([loadImage(avatar1Url), loadImage(avatar2Url)]);

      const avatarSize = Math.floor(canvas.height * 0.45); 
      const yPos = (canvas.height - avatarSize) / 2;
      const leftX = Math.floor(canvas.width * 0.15);
      const rightX = Math.floor(canvas.width * 0.85) - avatarSize;

      const drawCircleImage = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.stroke();
      };

      drawCircleImage(img1, leftX, yPos, avatarSize); 
      drawCircleImage(img2, rightX, yPos, avatarSize);

      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
      const filePath = path.join(cachePath, `love_${uid1}_${uid2}.png`);
      
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filePath, buffer);

      return message.reply({
        body: `💞 Bound by Love:\n${name1} ❤️ ${name2}`,
        attachment: fs.createReadStream(filePath)
      }, () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply("❌ | Error: Image generation failed or User not found.");
    }
  }
};
