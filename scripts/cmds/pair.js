const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "1.2.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Create a pair between group members with image",
    longDescription: "Randomly selects two members and generates a 16:9 pair image.",
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;

      if (participantIDs.length < 2) {
        return api.sendMessage("Group needs at least 2 members to make a pair!", threadID, messageID);
      }

      // র‍্যান্ডম সিলেকশন
      let id1 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
      let id2 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
      while (id1 === id2) {
        id2 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
      }

      // ইউজার ডাটা এবং নাম
      const userData = await api.getUserInfo([id1, id2]);
      const name1 = userData[id1].name;
      const name2 = userData[id2].name;
      const matchPercent = Math.floor(Math.random() * 51) + 50; // ৫০% থেকে ১০০% এর মধ্যে

      // ইমেজ তৈরির প্রস্তুতি
      const bgPath = path.join(__dirname, "assets", "image", "background.jpg");
      if (!fs.existsSync(bgPath)) {
        return api.sendMessage("Background image not found in assets/image/background.jpg", threadID, messageID);
      }

      const canvas = createCanvas(1280, 720); // ১৬:৯ (720p)
      const ctx = canvas.getContext("2d");

      // ব্যাকগ্রাউন্ড ড্র করা
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // প্রোফাইল পিকচার লোড করা
      const avatar1 = await loadImage(`https://graph.facebook.com/${id1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
      const avatar2 = await loadImage(`https://graph.facebook.com/${id2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

      // প্রোফাইল পিকচার পজিশন (১৬:৯ এ দুপাশে)
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

      // মাঝখানে হার্ট ইমোজি বা আইকন (বিকল্প হিসেবে টেক্সট)
      ctx.font = "bold 150px Arial";
      ctx.textAlign = "center";
      ctx.fillText("💞", 640, 410);

      // ইমেজ সেভ করা
      const tempImgPath = path.join(__dirname, "cache", `pair_${threadID}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(tempImgPath, buffer);

      // মেসেজ ফরম্যাট
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
