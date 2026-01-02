const { Jimp } = require("jimp");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["ki"],
    version: "3.8",
    author: "AkHi",
    countDown: 5,
    role: 0,
    category: "fun",
    guide: "{pn} @mention or reply"
  },

  onStart: async function ({ api, message, event }) {
    const { threadID, senderID, messageReply, type, mentions } = event;
    let targetID;

    const specialUser1 = "61583939430347";
    const specialUser2 = "61585634146171";
    const specialList = [specialUser1, specialUser2];

    // টার্গেট আইডি সিলেকশন
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

    // ডেভেলপার রেস্ট্রিকশন চেক
    if (!specialList.includes(senderID) && specialList.includes(targetID)) {
      return message.reply("❌ Access Denied for Developer Restriction");
    }

    const bgPath = path.join(__dirname, "assets/image/kiss.jpg");
    const tempPath = path.join(process.cwd(), "tmp", `kiss_${Date.now()}.png`);

    if (!fs.existsSync(bgPath)) return message.reply("❌ Error: 'assets/image/kiss.jpg' not found!");

    try {
      const info = await api.getUserInfo([senderID, targetID]);
      const senderName = info[senderID]?.name || "Someone";
      const targetName = info[targetID]?.name || "Someone";

      message.reply("⏳ Kissing in progress...");

      const getImg = async (id) => {
        const url = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return res.data;
      };

      const [bufSender, bufTarget] = await Promise.all([getImg(senderID), getImg(targetID)]);

      const bg = await Jimp.read(bgPath);
      const imgSender = await Jimp.read(bufSender);
      const imgTarget = await Jimp.read(bufTarget);
      
      // লাভ ইমোজি (সরাসরি টেক্সট না লিখে ইমোজি রিড করা ভালো, অথবা এটি একটি ছোট ইমেজ হতে পারে)
      // এখানে আমরা একটি সিম্পল লাভ সাইন কল্পনা করছি।
      
      await imgSender.resize({ w: 200, h: 200 });
      await imgTarget.resize({ w: 200, h: 200 });
      imgSender.circle();
      imgTarget.circle();

      const bgW = bg.bitmap.width;
      const bgH = bg.bitmap.height;
      const yAxis = Math.floor((bgH / 2) - 100);
      const leftX = Math.floor(bgW * 0.15);
      const rightX = Math.floor(bgW * 0.70);

      // ছবিগুলো বসানো
      bg.composite(imgSender, leftX, yAxis);
      bg.composite(imgTarget, rightX, yAxis);

      // লাভ ইমোজি বসানো (দুই ছবির মাঝখানে)
      // যদি আপনার কাছে কোনো হৃদয়ের ইমেজ থাকে তবে সেটি এখানে লোড করে বসাতে পারেন।
      // বর্তমানে আমরা একটি হার্ট ইমোজি প্রিন্ট করার চেষ্টা করছি (Jimp এ ইমোজি ফন্ট ছাড়া সরাসরি আসে না)

      const buffer = await bg.getBuffer("image/png");
      await fs.ensureDir(path.dirname(tempPath));
      await fs.writeFile(tempPath, buffer);

      await message.reply({
        body: `😘 ${senderName} kissed ${targetName}! ❤️`,
        attachment: fs.createReadStream(tempPath)
      });

      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    } catch (err) {
      console.error(err);
      message.reply(`❌ Error: ${err.message}`);
    }
  }
};
