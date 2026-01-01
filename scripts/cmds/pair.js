const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "1.3.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Create a pair between group members with image",
    longDescription: "Pairs you or a mentioned person with a random group member.",
    category: "fun",
    guide: "{pn} or {pn} @mention/reply/uid"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;

      if (participantIDs.length < 2) {
        return api.sendMessage("Group needs at least 2 members to make a pair!", threadID, messageID);
      }

      // ১. টার্গেট ইউজার নির্ধারণ (যাকে নিয়ে পেয়ার হবে)
      let id1;
      if (type === "message_reply") {
        id1 = messageReply.senderID;
      } else if (Object.keys(mentions).length > 0) {
        id1 = Object.keys(mentions)[0];
      } else if (args.length > 0 && !isNaN(args[0])) {
        id1 = args[0];
      } else {
        id1 = senderID; // যদি কিছু না থাকে তবে নিজের সাথে
      }

      // ২. দ্বিতীয় ইউজার (র‍্যান্ডম পার্টনার)
      let remainingIDs = participantIDs.filter(id => id !== id1);
      if (remainingIDs.length === 0) remainingIDs = participantIDs; // সেফটি চেক
      
      let id2 = remainingIDs[Math.floor(Math.random() * remainingIDs.length)];

      // ইউজার ডাটা এবং নাম
      const userData = await api.getUserInfo([id1, id2]);
      const name1 = userData[id1]?.name || "Facebook User";
      const name2 = userData[id2]?.name || "Facebook User";
      const matchPercent = Math.floor(Math.random() * 51) + 50;

      // ইমেজ তৈরির প্রস্তুতি
      const bgPath = path.join(__dirname, "assets", "image", "background.jpg");
      if (!fs.existsSync(bgPath)) {
        return api.sendMessage("Background image not found in assets/image/background.jpg", threadID, messageID);
      }

      const canvas = createCanvas(1280, 720);
      const ctx = canvas.getContext("2d");

      // ব্যাকগ্রাউন্ড
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // প্রোফাইল পিকচার (নতুন Access Token সহ যা সাধারণত কাজ করে)
      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const avatar1 = await loadImage(`https://graph.facebook.com/${id1}/picture?width=512&height=512&access_token=${token}`);
      const avatar2 = await loadImage(`https://graph.facebook.com/${id2}/picture?width=512&height=512&access_token=${token}`);

      // বাম দিকের ছবি
      ctx.save();
      ctx.beginPath();
      ctx.arc(320, 360, 180, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar1, 140, 180, 360, 360);
      ctx.restore();

      // ডান দিকের ছবি
      ctx.save();
      ctx.beginPath();
      ctx.arc(960, 360, 180, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar2, 780, 180, 360, 360);
      ctx.restore();

      // মাঝখানে হার্ট
      ctx.font = "bold 150px Arial";
      ctx.textAlign = "center";
      ctx.fillText("💞", 640, 410);

      // ইমেজ সেভ
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const tempImgPath = path.join(cacheDir, `pair_${id1}_${id2}.png`);
      
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(tempImgPath, buffer);

      const msg = `~ Successful Pair! 🥰\n~ ${name1} paired with ${name2}\n~ Match percentage: ${matchPercent}%`;

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(tempImgPath)
      }, threadID, () => fs.unlinkSync(tempImgPath), messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(`Error: ${error.message}`, threadID, messageID);
    }
  }
};
