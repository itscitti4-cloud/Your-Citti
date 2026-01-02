const { Jimp, loadFont } = require("jimp"); // loadFont ইম্পোর্ট করা হয়েছে
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["ki"],
    version: "4.3",
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

    if (!fs.existsSync(bgPath)) {
      react("❌");
      if (processingMsg) api.unsendMessage(processingMsg.messageID);
      return message.reply("❌ Error: 'assets/image/kiss.jpg' not found!");
    }

    try {
      const info = await api.getUserInfo([senderID, targetID]);
      const senderName = info[senderID]?.name.split(" ")[0] || "Someone";
      const targetName = info[targetID]?.name.split(" ")[0] || "Someone";

      const getImg = async (id) => {
        const url = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return res.data;
      };

      const [bufSender, bufTarget] = await Promise.all([getImg(senderID), getImg(targetID)]);

      const bg = await Jimp.read(bgPath);
      const imgSender = await Jimp.read(bufSender);
      const imgTarget = await Jimp.read(bufTarget);
      
      await imgSender.resize({ w: 200, h: 200 });
      await imgTarget.resize({ w: 200, h: 200 });
      imgSender.circle();
      imgTarget.circle();

      const bgW = bg.bitmap.width;
      const bgH = bg.bitmap.height;
      const yAxis = Math.floor((bgH / 2) - 100);
      const leftX = Math.floor(bgW * 0.15);
      const rightX = Math.floor(bgW * 0.70);

      bg.composite(imgSender, leftX, yAxis);
      bg.composite(imgTarget, rightX, yAxis);

      try {
        const emojiUrl = "https://emojicdn.elk.sh/😘?style=apple";
        const emojiBuf = await axios.get(emojiUrl, { responseType: "arraybuffer" });
        const emojiImg = await Jimp.read(emojiBuf.data);
        await emojiImg.resize({ w: 100, h: 100 });
        bg.composite(emojiImg, Math.floor((bgW / 2) - 50), Math.floor((bgH / 2) - 50));
      } catch (e) { console.log("Emoji skip"); }

      // ফিক্স: Jimp v1.x এ ফন্ট লোড করার সঠিক পদ্ধতি
      const font = await loadFont(Jimp.FONT_SANS_32_WHITE);
      
      bg.print({
        font: font,
        x: leftX,
        y: yAxis + 210,
        text: { text: senderName, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
        maxWidth: 200
      });

      bg.print({
        font: font,
        x: rightX,
        y: yAxis + 210,
        text: { text: targetName, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
        maxWidth: 200
      });

      const buffer = await bg.getBuffer("image/png");
      await fs.ensureDir(path.dirname(tempPath));
      await fs.writeFile(tempPath, buffer);

      if (processingMsg) api.unsendMessage(processingMsg.messageID);
      react("✅");

      await message.reply({
        body: `😘 ${senderName} kissed ${targetName}! ❤️`,
        attachment: fs.createReadStream(tempPath)
      });

      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    } catch (err) {
      console.error(err);
      react("❌");
      if (processingMsg) api.unsendMessage(processingMsg.messageID);
      message.reply(`❌ Error: ${err.message}`);
    }
  }
};
                     
