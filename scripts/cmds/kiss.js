const { Jimp } = require("jimp");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["ki"],
    version: "2.9",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Create a kiss image",
    longDescription: "Merges profile pictures onto a 16:9 background.",
    category: "fun",
    guide: "{pn} @mention or reply"
  },

  onStart: async function ({ api, message, event }) {
    const { threadID, senderID, messageReply, type, mentions } = event;
    let targetID;

    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const listID = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());
        targetID = listID.length > 0 ? listID[Math.floor(Math.random() * listID.length)] : senderID;
      } catch (e) {
        targetID = senderID;
      }
    }

    const bgPath = path.join(__dirname, "assets/image/kiss.jpg");
    // Path ফিক্স: মেইন ডিরেক্টরিতে tmp ফোল্ডার ব্যবহার করা নিরাপদ
    const tempPath = path.join(process.cwd(), "tmp", `kiss_${Date.now()}.png`);

    if (!fs.existsSync(bgPath)) {
      return message.reply("❌ Error: 'assets/image/kiss.jpg' file not found!");
    }

    try {
      const info = await api.getUserInfo([senderID, targetID]);
      const senderName = info[senderID]?.name || "Someone";
      const targetName = info[targetID]?.name || "Someone";

      const avatarSenderUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

      message.reply("⏳ Processing image, please wait...");

      // Header যোগ করা হয়েছে যাতে Download fail না হয়
      const getImg = async (url) => {
        const res = await axios.get(url, { 
          responseType: "arraybuffer",
          headers: { 'User-Agent': 'Mozilla/5.0' } 
        });
        return res.data;
      };

      const [bufSender, bufTarget] = await Promise.all([
        getImg(avatarSenderUrl),
        getImg(avatarTargetUrl)
      ]);

      const bg = await Jimp.read(bgPath);
      const imgSender = await Jimp.read(bufSender);
      const imgTarget = await Jimp.read(bufTarget);

      imgSender.circle();
      imgTarget.circle();
      imgSender.resize(200, 200);
      imgTarget.resize(200, 200);

      // ১৬:৯ পজিশন (Center Y-axis)
      const yAxis = (bg.getHeight() / 2) - 100;
      const leftX = (bg.getWidth() * 0.15);
      const rightX = (bg.getWidth() * 0.70);

      bg.composite(imgSender, leftX, yAxis);
      bg.composite(imgTarget, rightX, yAxis);

      await fs.ensureDir(path.dirname(tempPath));
      await bg.writeAsync(tempPath);

      await message.reply({
        body: `😘 ${senderName} kissed ${targetName}!`,
        attachment: fs.createReadStream(tempPath)
      });

      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    } catch (err) {
      console.error(err);
      message.reply(`❌ Failed to process image: ${err.message}`);
    }
  }
};
