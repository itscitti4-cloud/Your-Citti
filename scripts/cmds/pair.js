const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "2.9.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Pair with custom drawn heart",
    longDescription: "Pairs you with opposite gender. Custom heart drawing to avoid 2764 error.",
    category: "fun",
    guide: "{pn} or {pn} 3/4/5 (for males)"
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

      const bgPath = path.join(__dirname, "assets", "image", "background.jpg");
      if (!fs.existsSync(bgPath)) return api.sendMessage("Background image missing!", threadID, messageID);

      const canvas = createCanvas(1280, 720);
      const ctx = canvas.getContext("2d");
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const getAvatarUrl = (id) => `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${token}`;

      // ড্রয়িং ফাংশন (ইউজার প্রোফাইল)
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

      // মেইন ফিক্স: ইমোজির পরিবর্তে গাণিতিক উপায়ে হার্ট ড্র করা
      const drawHeartWithPercent = (x, y, size) => {
        const percent = Math.floor(Math.random() * 51) + 50;
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = "#FF0000";
        // হার্ট শেপ পাথ
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
        ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        ctx.fill();
        ctx.closePath();

        // পার্সেন্টেজ টেক্সট
        ctx.font = `bold ${size/3}px Arial`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(`${percent}%`, x, y + size/1.6);
        ctx.restore();
      };

      const centerX = 640;
      const centerY = 360;
      let partnerFullNames = [];

      if (selectedPartners.length === 1) {
        await drawUser(id1, 320, 360, 180, 40);
        const pName = await drawUser(selectedPartners[0], 960, 360, 180, 40);
        partnerFullNames.push(pName);
        drawHeartWithPercent(centerX - 75, centerY - 75, 150); // বড় হার্ট
      } else {
        await drawUser(id1, centerX, centerY - 20, 140, 35);
        const arrangementRadius = 270;
        for (let i = 0; i < selectedPartners.length; i++) {
          const angle = (i * 2 * Math.PI) / selectedPartners.length;
          const x = centerX + arrangementRadius * Math.cos(angle);
          const y = centerY + arrangementRadius * Math.sin(angle);
          const pName = await drawUser(selectedPartners[i], x, y, 85, 22);
          partnerFullNames.push(pName);
          drawHeartWithPercent(((centerX + x) / 2) - 30, ((centerY + y) / 2) - 30, 60); // ছোট হার্ট
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
        
