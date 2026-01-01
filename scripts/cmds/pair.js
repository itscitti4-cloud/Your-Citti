const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "3.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Pair with perfectly centered heart UI",
    longDescription: "Pairs with opposite gender, shows custom hearts perfectly centered on connection lines.",
    category: "fun",
    guide: "{pn} or {pn} 3/4/5"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const { userInfo: allUsers } = threadInfo;

      let id1 = type === "message_reply" ? messageReply.senderID : (Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : senderID);
      const user1Info = await api.getUserInfo(id1);
      const gender1 = user1Info[id1].gender;

      let targetGender = gender1 === 2 ? 1 : 2; 
      let partners = threadInfo.participantIDs.filter(id => {
          const u = allUsers.find(x => x.id == id);
          return u && u.gender == targetGender && id !== id1;
      });

      if (partners.length === 0) partners = threadInfo.participantIDs.filter(id => id !== id1);

      let pairCount = (gender1 === 2 && args[0] && !isNaN(args[0])) ? Math.min(parseInt(args[0]), 5) : 1;
      let selectedPartners = [];
      for (let i = 0; i < pairCount; i++) {
          if (partners.length === 0) break;
          const randomIndex = Math.floor(Math.random() * partners.length);
          selectedPartners.push(partners.splice(randomIndex, 1)[0]);
      }

      const canvas = createCanvas(1280, 720);
      const ctx = canvas.getContext("2d");
      
      const bgPath = path.join(__dirname, "assets", "image", "background.jpg");
      if (fs.existsSync(bgPath)) {
        const background = await loadImage(bgPath);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#ffebee"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const getAvatarUrl = (id) => `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${token}`;

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

      // পারফেক্টলি সেন্টার্ড হার্ট ড্র ফাংশন
      const drawHeart = (x, y, size, percent) => {
        ctx.save();
        ctx.translate(x, y); // এই পয়েন্টটি এখন হার্টের কেন্দ্র
        ctx.beginPath();
        ctx.fillStyle = "#FF0000";
        const d = size / 2;
        
        // হার্ট শেপ ড্রয়িং (সেন্টার এডজাস্ট করা হয়েছে)
        ctx.moveTo(0, d / 2);
        ctx.bezierCurveTo(0, -d, -size, -d, -size, d / 2);
        ctx.bezierCurveTo(-size, size, 0, size * 1.5, 0, size * 1.8);
        ctx.bezierCurveTo(0, size * 1.5, size, size, size, d / 2);
        ctx.bezierCurveTo(size, -d, 0, -d, 0, d / 2);
        ctx.fill();

        // পার্সেন্টেজ টেক্সট (হার্টের ঠিক মাঝখানে)
        ctx.font = `bold ${size/1.5}px Arial`;
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.fillText(`${percent}%`, 0, size * 0.8);
        ctx.restore();
      };

      const centerX = 640, centerY = 360;
      let partnerData = [];

      if (selectedPartners.length === 1) {
        await drawUser(id1, 320, 360, 180, 40);
        const pName = await drawUser(selectedPartners[0], 960, 360, 180, 40);
        const pct = Math.floor(Math.random() * 51) + 50;
        // সিঙ্গেল পেয়ারের ক্ষেত্রে একদম সেন্টারে
        drawHeart(centerX, centerY - 80, 80, pct); 
        partnerData.push({ name: pName, pct: pct });
      } else {
        await drawUser(id1, centerX, centerY, 140, 35);
        const radius = 270;
        for (let i = 0; i < selectedPartners.length; i++) {
          const angle = (i * 2 * Math.PI) / selectedPartners.length;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const pName = await drawUser(selectedPartners[i], x, y, 85, 22);
          const pct = Math.floor(Math.random() * 51) + 50;
          // কানেকশন লাইনের ঠিক মাঝখানে হার্ট
          drawHeart((centerX + x) / 2, (centerY + y) / 2 - 40, 35, pct);
          partnerData.push({ name: pName, pct: pct });
        }
      }

      const tempImgPath = path.join(__dirname, "cache", `pair_${Date.now()}.png`);
      fs.ensureDirSync(path.join(__dirname, "cache"));
      fs.writeFileSync(tempImgPath, canvas.toBuffer("image/png"));

      const partnerList = partnerData.map(p => p.name).join(", ");
      const msg = `~ Successful Pair! 🥰\n~ ${user1Info[id1].name} paired with ${partnerList}\n~ Match percentage: ${pctList}%`;

      return api.sendMessage({ body: msg, attachment: fs.createReadStream(tempImgPath) }, threadID, () => fs.unlinkSync(tempImgPath), messageID);
    } catch (e) { return api.sendMessage(`Error: ${e.message}`, threadID, messageID); }
  }
};
