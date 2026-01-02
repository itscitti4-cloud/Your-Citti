const Jimp = require("jimp");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["ki"],
    version: "2.6",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Create a kiss image",
    longDescription: "Merges two profile pictures onto a 16:9 kiss background. Supports mention, reply, or random member.",
    category: "fun",
    guide: "{pn} @mention or reply to a message"
  },

  onStart: async function ({ api, message, event, threadsData }) {
    const senderID = event.senderID;
    let targetID;

    // ১. কন্ডিশনাল টার্গেট সিলেকশন (Reply > Mention > Random)
    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      const threadInfo = await threadsData.get(event.threadID);
      const allMembers = threadInfo.members.map(m => m.userID).filter(id => id !== senderID);
      if (allMembers.length === 0) return message.reply("There are no other members to kiss!");
      targetID = allMembers[Math.floor(Math.random() * allMembers.length)];
    }

    const bgPath = path.join(__dirname, "assets/image/kiss.jpg");
    const tempPath = path.join(__dirname, `tmp/kiss_${senderID}_${targetID}.png`);

    if (!fs.existsSync(bgPath)) {
      return message.reply("❌ Background image not found in assets/image/kiss.jpg");
    }

    try {
      const users = await api.getUserInfo([senderID, targetID]);
      const senderName = users[senderID]?.name || "Someone";
      const targetName = users[targetID]?.name || "Someone";

      const avatarSenderUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

      message.reply("⏳ Creating image, please wait...");

      const [bufSender, bufTarget] = await Promise.all([
        axios.get(avatarSenderUrl, { responseType: "arraybuffer" }).then(res => res.data),
        axios.get(avatarTargetUrl, { responseType: "arraybuffer" }).then(res => res.data)
      ]);

      const bg = await Jimp.read(bgPath);
      const imgSender = await Jimp.read(bufSender);
      const imgTarget = await Jimp.read(bufTarget);

      // সার্কেল শেপ
      imgSender.circle();
      imgTarget.circle();

      // ১৬:৯ ব্যাকগ্রাউন্ডের জন্য সাইজ কিছুটা বাড়ানো হয়েছে (২০০x২০০)
      imgSender.resize(200, 200); 
      imgTarget.resize(200, 200);

      /**
       * ১৬:৯ পজিশনিং ক্যালকুলেশন:
       * সাধারণত ১২৮০x৭২০ ইমেজের জন্য:
       * বামের পজিশন: X=250, Y=মাঝামাঝি
       * ডানের পজিশন: X=830, Y=মাঝামাঝি
       */
      const yAxis = (bg.getHeight() / 2) - 100; // ইমেজের উচ্চতার ঠিক মাঝখানে
      const leftX = (bg.getWidth() * 0.20);     // বাম দিক থেকে ২০% ভেতরে
      const rightX = (bg.getWidth() * 0.65);    // বাম দিক থেকে ৬৫% ভেতরে (ডান পাশে)

      bg.composite(imgSender, leftX, yAxis); 
      bg.composite(imgTarget, rightX, yAxis); 

      await fs.ensureDir(path.dirname(tempPath));
      await bg.writeAsync(tempPath);

      await message.reply({
        body: `😘 ${senderName} kissed ${targetName}!`,
        attachment: fs.createReadStream(tempPath)
      });

      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error(err);
      message.reply("❌ Error: Could not create the image!");
    }
  }
};
