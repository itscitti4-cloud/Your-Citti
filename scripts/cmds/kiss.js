const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["ki"],
    version: "5.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    category: "fun",
    guide: "{pn} @mention or reply"
  },

  onStart: async function ({ api, message, event }) {
    const { threadID, messageID, senderID, messageReply, type, mentions } = event;
    let targetID;

    const react = (emoji) => api.setMessageReaction(emoji, messageID, () => {}, true);

    const specialUser1 = "61583939430347";
    const specialUser2 = "61585634146171";
    const specialList = [specialUser1, specialUser2];

    react("⏳");
    const processingMsg = await message.reply("⏳ Kissing in progress...");

    // টার্গেট আইডি নির্ধারণ
    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      if (senderID === specialUser1) targetID = specialUser2;
      else if (senderID === specialUser2) targetID = specialUser1;
      else {
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          const listID = threadInfo.participantIDs.filter(id => 
            id != senderID && id != api.getCurrentUserID() && !specialList.includes(id)
          );
          targetID = listID.length > 0 ? listID[Math.floor(Math.random() * listID.length)] : senderID;
        } catch (e) { targetID = senderID; }
      }
    }

    if (!specialList.includes(senderID) && specialList.includes(targetID)) {
      react("❌");
      if (processingMsg) api.unsendMessage(processingMsg.messageID);
      return message.reply("❌ Access Denied for Developer Restriction");
    }

    const bgPath = path.join(__dirname, "assets/image/kiss.jpg");
    const tempPath = path.join(process.cwd(), "tmp", `kiss_${Date.now()}.png`);

    try {
      const info = await api.getUserInfo([senderID, targetID]);
      const senderName = info[senderID]?.name.split(" ")[0] || "Someone";
      const targetName = info[targetID]?.name.split(" ")[0] || "Someone";

      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const getImgUrl = (id) => `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${token}`;

      // ইমেজ লোড করা
      const [bgImg, avatarSender, avatarTarget] = await Promise.all([
        loadImage(bgPath),
        loadImage(getImgUrl(senderID)),
        loadImage(getImgUrl(targetID))
      ]);

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      // ব্যাকগ্রাউন্ড ড্র করা
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const avatarSize = 200;
      const yAxis = (canvas.height / 2) - (avatarSize / 2);
      const leftX = canvas.width * 0.15;
      const rightX = canvas.width * 0.70;

      // প্রোফাইল পিকচার ড্র করার ফাংশন
      const drawAvatar = (img, x, y) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, avatarSize, avatarSize);
        ctx.restore();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.stroke();
      };

      drawAvatar(avatarSender, leftX, yAxis);
      drawAvatar(avatarTarget, rightX, yAxis);

      // মাঝখানে ইমোজি ড্র করা
      try {
        const emojiImg = await loadImage("https://emojicdn.elk.sh/😘?style=apple");
        const emojiSize = 100;
        ctx.drawImage(emojiImg, (canvas.width / 2) - (emojiSize / 2), (canvas.height / 2) - (emojiSize / 2), emojiSize, emojiSize);
      } catch (e) { console.log("Emoji error"); }

      // নাম লেখা
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 8;
      ctx.fillText(senderName, leftX + (avatarSize / 2), yAxis + avatarSize + 40);
      ctx.fillText(targetName, rightX + (avatarSize / 2), yAxis + avatarSize + 40);

      const buffer = canvas.toBuffer("image/png");
      await fs.ensureDir(path.dirname(tempPath));
      fs.writeFileSync(tempPath, buffer);

      if (processingMsg) api.unsendMessage(processingMsg.messageID);
      react("✅");

      await message.reply({
        body: `😘 ${senderName} kissed ${targetName}! ❤️`,
        attachment: fs.createReadStream(tempPath)
      });

      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error(err);
      react("❌");
      if (processingMsg) api.unsendMessage(processingMsg.messageID);
      message.reply(`❌ Error: ${err.message}`);
    }
  }
};
