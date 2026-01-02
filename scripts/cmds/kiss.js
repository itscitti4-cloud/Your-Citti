const { Jimp } = require("jimp");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["ki"],
    version: "3.6",
    author: "AkHi",
    countDown: 5,
    role: 0,
    category: "fun",
    guide: "{pn} @mention or reply"
  },

  onStart: async function ({ api, message, event }) {
    const { threadID, senderID, messageReply, type, mentions } = event;
    let targetID;

    // বিশেষ UID জোড়া
    const specialUser1 = "61583939430347";
    const specialUser2 = "61585634146171";
    const specialList = [specialUser1, specialUser2];

    // ১. টার্গেট আইডি নির্ধারণ
    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } 
    else {
      // যদি কেউ মেনশন/রিপ্লাই না দেয় এবং সে বিশেষ ইউজার হয়
      if (senderID === specialUser1) {
        targetID = specialUser2;
      } else if (senderID === specialUser2) {
        targetID = specialUser1;
      } else {
        // সাধারণ ইউজারদের জন্য র্যান্ডম বাছাই (বিশেষ ২ জন বাদে)
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          const listID = threadInfo.participantIDs.filter(id => 
            id != senderID && 
            id != api.getCurrentUserID() && 
            !specialList.includes(id)
          );
          targetID = listID.length > 0 ? listID[Math.floor(Math.random() * listID.length)] : senderID;
        } catch (e) {
          targetID = senderID;
        }
      }
    }

    // ২. ডেভেলপার রেস্ট্রিকশন চেক (মূল নিরাপত্তা)
    // যদি সেন্ডার সাধারণ ইউজার হয় কিন্তু সে বিশেষ কাউকে টার্গেট করে
    if (!specialList.includes(senderID) && specialList.includes(targetID)) {
      return message.reply("❌ Access Denied for Developer Restriction");
    }

    const bgPath = path.join(__dirname, "assets/image/kiss.jpg");
    const tempPath = path.join(process.cwd(), "tmp", `kiss_${Date.now()}.png`);

    if (!fs.existsSync(bgPath)) {
      return message.reply("❌ Error: 'assets/image/kiss.jpg' not found!");
    }

    try {
      const info = await api.getUserInfo([senderID, targetID]);
      const senderName = info[senderID]?.name || "Someone";
      const targetName = info[targetID]?.name || "Someone";

      const avatarSenderUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

      message.reply("⏳ Processing image...");

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

      // Jimp v1.x Resize
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

      await fs.ensureDir(path.dirname(tempPath));
      const buffer = await bg.getBuffer("image/png");
      await fs.writeFile(tempPath, buffer);

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
