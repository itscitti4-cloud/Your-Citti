const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "2.6.0",
    author: "AkHi & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: "Pair with names and dynamic layout",
    longDescription: "Pairs you with opposite gender. Supports single/multiple partners with names displayed on image.",
    category: "fun",
    guide: "{pn} or {pn} 3/4/5 (for males)"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const { userInfo: allUsers } = threadInfo;

      // ১. টার্গেট ইউজার নির্ধারণ
      let id1;
      if (type === "message_reply") id1 = messageReply.senderID;
      else if (Object.keys(mentions).length > 0) id1 = Object.keys(mentions)[0];
      else id1 = senderID;

      const user1Info = await api.getUserInfo(id1);
      const gender1 = user1Info[id1].gender;
      const name1 = user1Info[id1].name.split(" ")[0]; // শুধু প্রথম নাম ইমেজের জন্য

      // ২. জেন্ডার অনুযায়ী ফিল্টার
      let targetGender = gender1 === 2 ? 1 : 2; 
      let partners = threadInfo.participantIDs.filter(id => {
          const u = allUsers.find(x => x.id == id);
          return u && u.gender == targetGender && id !== id1;
      });

      if (partners.length === 0) partners = threadInfo.participantIDs.filter(id => id !== id1);

      // ৩. মাল্টিপল পেয়ার সংখ্যা নির্ধারণ (ছেলেদের জন্য)
      let pairCount = 1;
      if (gender1 === 2 && args[0] && !isNaN(args[0])) {
          pairCount = Math.min(parseInt(args[0]), 5);
      }

      let selectedPartners = [];
      for (let i = 0; i < pairCount; i++) {
          if (partners.length === 0) break;
          const randomIndex = Math.floor(Math.random() * partners.length);
          selectedPartners.push(partners.splice(randomIndex, 1)[0]);
      }

      // ৪. ক্যানভাস এবং ইমেজ সেটআপ
      const bgPath = path.join(__dirname, "assets", "image", "background.jpg");
      if (!fs.existsSync(bgPath)) return api.sendMessage("Background image missing!", threadID, messageID);

      const canvas = createCanvas(1280, 720);
      const ctx = canvas.getContext("2d");
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const getAvatarUrl = (id) => `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${token}`;

      // সার্কেল এবং নাম ড্রয়িং ফাংশন
      const drawUser = async (id, x, y, radius, fontSize) => {
        try {
          const info = await api.getUserInfo(id);
          const name = info[id].name.split(" ")[0];
          const url = getAvatarUrl(id);
          const img = await loadImage(url);
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
          ctx.restore();

          // বর্ডার
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 4;
          ctx.stroke();

          // নাম লেখা (ছবির ঠিক নিচে)
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.shadowColor = "black";
          ctx.shadowBlur = 10;
          ctx.fillText(name, x, y + radius + fontSize + 5);
          ctx.shadowBlur = 0; // শ্যাডো রিসেট
          return info[id].name;
        } catch (e) { return "User"; }
      };

      const centerX = 640;
      const centerY = 360;
      let partnerFullNames = [];

      if (selectedPartners.length === 1) {
        // সিঙ্গেল পেয়ার লেআউট
        await drawUser(id1, 320, 360, 180, 35);
        const pName = await drawUser(selectedPartners[0], 960, 360, 180, 35);
        partnerFullNames.push(pName);
        
        // মাঝখানে হার্ট এবং পার্সেন্টেজ
        const matchPercent = Math.floor(Math.random() * 51) + 50;
        ctx.font = "bold 150px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("❤️", centerX, centerY + 50);
        ctx.font = "bold 40px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(`${matchPercent}%`, centerX, centerY + 35);
      } else {
        // মাল্টিপল পেয়ার লেআউট
        await drawUser(id1, centerX, centerY - 20, 140, 30);

        const arrangementRadius = 260;
        for (let i = 0; i < selectedPartners.length; i++) {
          const angle = (i * 2 * Math.PI) / selectedPartners.length;
          const x = centerX + arrangementRadius * Math.cos(angle);
          const y = centerY + arrangementRadius * Math.sin(angle);
          
          const pName = await drawUser(selectedPartners[i], x, y, 80, 20);
          partnerFullNames.push(pName);

          // ছোট লাভ কানেকশন
          ctx.font = "30px Arial";
          ctx.fillText("❤️", (centerX + x) / 2, (centerY + y) / 2);
        }
      }

      // ৫. আউটপুট মেসেজ ও ফাইল পাঠানো
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const tempImgPath = path.join(cacheDir, `pair_${Date.now()}.png`);
      fs.writeFileSync(tempImgPath, canvas.toBuffer("image/png"));

      const msg = `~ Successful Pair! 🥰\n~ ${user1Info[id1].name} paired with: ${partnerFullNames.join(", ")}`;

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
        
