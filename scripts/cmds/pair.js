const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "2.8.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Pair with Heart-Percentage UI",
    longDescription: "Pairs you with opposite gender. Display matching % inside heart emoji for all modes.",
    category: "fun",
    guide: "{pn} or {pn} 3/4/5 (for males)"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const { userInfo: allUsers } = threadInfo;

      let id1;
      if (type === "message_reply") id1 = messageReply.senderID;
      else if (Object.keys(mentions).length > 0) id1 = Object.keys(mentions)[0];
      else id1 = senderID;

      const user1Info = await api.getUserInfo(id1);
      const gender1 = user1Info[id1].gender;

      let targetGender = gender1 === 2 ? 1 : 2; 
      let partners = threadInfo.participantIDs.filter(id => {
          const u = allUsers.find(x => x.id == id);
          return u && u.gender == targetGender && id !== id1;
      });

      if (partners.length === 0) partners = threadInfo.participantIDs.filter(id => id !== id1);

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

      const bgPath = path.join(__dirname, "assets", "image", "background.jpg");
      if (!fs.existsSync(bgPath)) return api.sendMessage("Background image missing!", threadID, messageID);

      const canvas = createCanvas(1280, 720);
      const ctx = canvas.getContext("2d");
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const getAvatarUrl = (id) => `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${token}`;

      // ড্রয়িং ফাংশন (ছবি এবং নাম)
      const drawUser = async (id, x, y, radius, fontSize) => {
        try {
          const info = await api.getUserInfo(id);
          const name = info[id].name.split(" ")[0];
          const img = await loadImage(getAvatarUrl(id));
          
          ctx.save();
          ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2, true); ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
          ctx.restore();

          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 5; ctx.stroke();

          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = "white"; ctx.textAlign = "center";
          ctx.shadowColor = "black"; ctx.shadowBlur = 10;
          ctx.fillText(name, x, y + radius + fontSize + 10);
          ctx.shadowBlur = 0;
          return info[id].name;
        } catch (e) { return "User"; }
      };

      // লাভ + পার্সেন্টেজ ড্রয়িং ফাংশন (সেন্টার এলাইনড)
      const drawMatchInsideHeart = (x, y, heartSize, percentFontSize) => {
        const matchPercent = Math.floor(Math.random() * 51) + 50;
        ctx.textAlign = "center";
        
        // হার্ট ইমোজি
        ctx.font = `${heartSize}px Arial`;
        ctx.fillStyle = "red";
        ctx.fillText("❤️", x, y + (heartSize / 3.5)); 

        // পার্সেন্টেজ (সাদা রঙে হার্টের ভেতরে)
        ctx.font = `bold ${percentFontSize}px Arial`;
        ctx.fillStyle = "white";
        ctx.fillText(`${matchPercent}%`, x, y + (heartSize / 15)); 
      };

      const centerX = 640;
      const centerY = 360;
      let partnerFullNames = [];

      if (selectedPartners.length === 1) {
        // সিঙ্গেল পেয়ার লেআউট
        await drawUser(id1, 320, 360, 180, 40);
        const pName = await drawUser(selectedPartners[0], 960, 360, 180, 40);
        partnerFullNames.push(pName);
        
        // সেন্টারে বড় হার্ট ও পার্সেন্টেজ
        drawMatchInsideHeart(centerX, centerY, 160, 45);
      } else {
        // মাল্টিপল পেয়ার লেআউট
        await drawUser(id1, centerX, centerY - 20, 140, 35);
        const arrangementRadius = 270;

        for (let i = 0; i < selectedPartners.length; i++) {
          const angle = (i * 2 * Math.PI) / selectedPartners.length;
          const x = centerX + arrangementRadius * Math.cos(angle);
          const y = centerY + arrangementRadius * Math.sin(angle);
          
          const pName = await drawUser(selectedPartners[i], x, y, 85, 22);
          partnerFullNames.push(pName);

          // প্রতি পার্টনারের লাইনের ওপর ছোট হার্ট ও পার্সেন্টেজ
          drawMatchInsideHeart((centerX + x) / 2, (centerY + y) / 2, 70, 18);
        }
      }

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
                                                   
