const Jimp = require("jimp");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["ki"],
    version: "2.8",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Create a kiss image",
    longDescription: "Merges profile pictures onto a 16:9 background. Supports mention, reply, or random member.",
    category: "fun",
    guide: "{pn} @mention or reply"
  },

  onStart: async function ({ api, message, event }) {
    const { threadID, senderID, messageReply, type, mentions } = event;
    let targetID;

    // ১. টার্গেট নির্ধারণ (Reply > Mention > Random)
    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const listID = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());
        if (listID.length === 0) return message.reply("There are no other members to kiss!");
        targetID = listID[Math.floor(Math.random() * listID.length)];
      } catch (e) {
        return message.reply("Could not pick a random member.");
      }
    }

    const bgPath = path.join(__dirname, "assets/image/kiss.jpg");
    const tempPath = path.join(__dirname, "tmp", `kiss_${senderID}_${targetID}.png`);

    if (!fs.existsSync(bgPath)) {
      return message.reply("❌ Background image (assets/image/kiss.jpg) is missing!");
    }

    try {
      // ইউজার নেম নেওয়া
      const info = await api.getUserInfo([senderID, targetID]);
      const senderName = info[senderID]?.name || "Someone";
      const targetName = info[targetID]?.name || "Someone";

      // প্রোফাইল পিকচার URL
      const avatarSenderUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

      message.reply("⏳ Creating image, please wait...");

      // ইমেজ ডাউনলোড
      const [bufSender, bufTarget] = await Promise.all([
        axios.get(avatarSenderUrl, { responseType: "arraybuffer" }).then(res => res.data),
        axios.get(avatarTargetUrl, { responseType: "arraybuffer" }).then(res => res.data)
      ]);

      const bg = await Jimp.read(bgPath);
      const imgSender = await Jimp.read(bufSender);
      const imgTarget = await Jimp.read(bufTarget);

      // ১৬:৯ এর জন্য এডিটিং
      imgSender.circle();
      imgTarget.circle();
      imgSender.resize(200, 200);
      imgTarget.resize(200, 200);

      // পজিশনিং (১৬:৯ এর জন্য ডাইনামিক)
      const yAxis = (bg.getHeight() / 2) - 100;
      const leftX = (bg.getWidth() * 0.15);  // বাম দিক থেকে ১৫%
      const rightX = (bg.getWidth() * 0.70); // ডান দিকে বসানোর জন্য ৭০%

      bg.composite(imgSender, leftX, yAxis);
      bg.composite(imgTarget, rightX, yAxis);

      // ফাইল সেভ
      await fs.ensureDir(path.dirname(tempPath));
      await bg.writeAsync(tempPath);

      // সেন্ড করা
      await message.reply({
        body: `😘 ${senderName} kissed ${targetName}!`,
        attachment: fs.createReadStream(tempPath)
      });

      // ডিলিট করা
      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error(err);
      message.reply("❌ Error: Failed to process images. Make sure the bot has access.");
    }
  }
};
