const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "3.5.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Pair with UID restrictions and improved UI",
    longDescription: "Pairs with users, specific UIDs are protected and linked.",
    category: "fun",
    guide: "{pn} or {pn} 3/4/5"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    const specialUser1 = "61583939430347";
    const specialUser2 = "61585634146171";
    const specialList = [specialUser1, specialUser2];

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const { userInfo: allUsers } = threadInfo;

      let id1 = type === "message_reply" ? messageReply.senderID : (Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : senderID);
      
      // Developer Restriction Check
      if (!specialList.includes(senderID)) {
        if (type === "message_reply" && specialList.includes(messageReply.senderID)) {
          return api.sendMessage("❌ Access Denied for Developer Restriction", threadID, messageID);
        }
        if (Object.keys(mentions).some(m => specialList.includes(m))) {
          return api.sendMessage("❌ Access Denied for Developer Restriction", threadID, messageID);
        }
      }

      const user1Info = await api.getUserInfo(id1);
      const gender1 = user1Info[id1].gender;

      let selectedPartners = [];

      // Special Pairing Logic
      if (id1 === specialUser1) {
        selectedPartners = [specialUser2];
      } else if (id1 === specialUser2) {
        selectedPartners = [specialUser1];
      } else {
        // Normal Pairing Logic
        let targetGender = gender1 === 2 ? 1 : 2; 
        let partners = threadInfo.participantIDs.filter(id => {
            const u = allUsers.find(x => x.id == id);
            return u && u.gender == targetGender && id !== id1 && !specialList.includes(id);
        });

        if (partners.length === 0) {
          partners = threadInfo.participantIDs.filter(id => id !== id1 && !specialList.includes(id));
        }

        let pairCount = (args[0] && !isNaN(args[0])) ? Math.min(parseInt(args[0]), 5) : 1;
        for (let i = 0; i < pairCount; i++) {
            if (partners.length === 0) break;
            const randomIndex = Math.floor(Math.random() * partners.length);
            selectedPartners.push(partners.splice(randomIndex, 1)[0]);
        }
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

      const drawHeart = (x, y, size, percent) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.fillStyle = "#FF0000";
        // লাভ আইকন বড় করা হয়েছে (size * 1.5)
        const s = size * 1.5;
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(-s * 0.8, -s * 0.1, -s * 0.5, -s * 0.7, 0, -s * 0.3);
        ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.8, -s * 0.1, 0, s * 0.4);
        ctx.fill();
        // টেক্সট সাইজ আগের মতোই রাখা হয়েছে (size/2.5)
        ctx.font = `bold ${size/2.5}px Arial`;
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${percent}%`, 0, -s * 0.05);
        ctx.restore();
      };

      const centerX = 640, centerY = 360;
      let partnerData = [];

      if (selectedPartners.length === 1) {
        await drawUser(id1, 320, 360, 180, 40);
        const pName = await drawUser(selectedPartners[0], 960, 360, 180, 40);
        const pct = Math.floor(Math.random() * 51) + 50;
        drawHeart(centerX, centerY, 90, pct); 
        partnerData.push({ name: pName, pct: pct });
      } else {
        await drawUser(id1, centerX, centerY, 140, 35);
        const radius = 320;
        for (let i = 0; i < selectedPartners.length; i++) {
          const angle = (i * 2 * Math.PI) / selectedPartners.length;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const pName = await drawUser(selectedPartners[i], x, y, 85, 22);
          const pct = Math.floor(Math.random() * 51) + 50;
          drawHeart((centerX + x) / 2, (centerY + y) / 2, 45, pct);
          partnerData.push({ name: pName, pct: pct });
        }
      }

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
      const tempImgPath = path.join(cacheDir, `pair_${Date.now()}.png`);
      fs.writeFileSync(tempImgPath, canvas.toBuffer("image/png"));

      const partnerList = partnerData.map(p => p.name).join(", ");
      const pctList = partnerData.map(p => `${p.pct}%`).join(", ");
      
      const msg = `~ Successful Pair! 🥰\n~ ${user1Info[id1].name} paired with ${partnerList}\n~ Match percentage: ${pctList}`;

      return api.sendMessage({ body: msg, attachment: fs.createReadStream(tempImgPath) }, threadID, () => {
        if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);
      }, messageID);
    } catch (e) { 
      console.log(e);
      return api.sendMessage(`Error: ${e.message}`, threadID, messageID); 
    }
  }
};
            
