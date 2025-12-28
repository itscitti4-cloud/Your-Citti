const axios = require("axios");
const path = require("path");
const fs = require("fs");

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`,
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "album",
    version: "1.0.0",
    role: 0,
    author: "AkHi", // আপনি চাইলে এখন এটি পরিবর্তন করতে পারেন
    description: "Displays album options for selection.",
    category: "Media",
    countDown: 5,
    guide: {
      en: "{p}{n} or add [category]",
    },
  },

  onStart: async function ({ api, event, args }) {
    if (!args[0]) {
      api.setMessageReaction("😘", event.messageID, (err) => {}, true);
      const message =
        "╔══════════════════════╗\n" +
        "   ❤️‍🔥 𝗔𝗟𝗕𝗨𝗠 𝗠𝗘𝗡𝗨 𝗕𝗔𝗕𝗬 ❤️‍🔥\n" +
        "╚══════════════════════╝\n" +
        "┌ 𝟭. 𝗙𝘂𝗻𝗻𝘆 𝘃𝗶𝗱𝗲𝗼 🤡\n" +
        "├ 𝟮. 𝗜𝘀𝗹𝗮𝗺𝗶𝗰 𝘃𝗶𝗱𝗲𝗼 🕋\n" +
        "├ 𝟯. 𝗦𝗮𝗱 𝘃𝗶𝗱𝗲𝗼 💧\n" +
        "├ 𝟰. 𝗔𝗻𝗶𝗺𝗲 𝘃𝗶𝗱𝗲𝗼 🍥\n" +
        "├ 𝟱. 𝗖𝗮𝗿𝘁𝗼𝗼𝗻 𝘃𝗶𝗱𝗲𝗼 🎪\n" +
        "├ 𝟲. 𝗟𝗼𝗙𝗶 𝗩𝗶𝗱𝗲𝗼 ☁️\n" +
        "├ 𝟳. 𝗛𝗼𝗿𝗻𝘆 𝘃𝗶𝗱𝗲𝗼 ⛈️\n" +
        "├ 𝟴. 𝗖𝗼𝘂𝗽𝗹𝗲 𝗩𝗶𝗱𝗲𝗼 💍\n" +
        "├ 𝟵. 𝗙𝗹𝗼𝘄𝗲𝗿 𝗩𝗶𝗱𝗲𝗼 🌷\n" +
        "└ 𝟭𝟬. 𝗥𝗮𝗻𝗱𝗼𝗺 𝗣𝗵𝗼𝘁𝗼 🖼️\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "📍 𝗣𝗮𝗴𝗲 [ 𝟭/𝟮 ] ➪ 𝗨𝘀𝗲 !𝗮𝗹𝗯𝘂𝗺 𝟮";

      await api.sendMessage(
        message,
        event.threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        },
        event.messageID,
      );
    } else if (args[0] === "2") {
      api.setMessageReaction("😚", event.messageID, (err) => {}, true);
      const message =
        "╔══════════════════════╗\n" +
        "   ❤️‍🔥 𝗔𝗟𝗕𝗨𝗠 𝗠𝗘𝗡𝗨 𝗕𝗔𝗕𝗬 ❤️‍🔥\n" +
        "╚══════════════════════╝\n" +
        "┌ 𝟭𝟭. 𝗔𝗲𝘀𝘁𝗵𝗲𝘁𝗶𝗰 𝗩𝗶𝗱𝗲𝗼 😙\n" +
        "├ 𝟭𝟮. 𝗦𝗶𝗴𝗺𝗮 𝗥𝘂𝗹𝗲 🐤\n" +
        "├ 𝟭𝟯. 𝗟𝘆𝗿𝗶𝗰𝘀 𝗩𝗶𝗱𝗲𝗼 🥰\n" +
        "├ 𝟭𝟰. 𝗖𝗮𝘁 𝗩𝗶𝗱𝗲𝗼 😙\n" +
        "├ 𝟭𝟱. 𝟭𝟴+ 𝘃𝗶𝗱𝗲𝗼 🔞\n" +
        "├ 𝟭𝟲. 𝗙𝗿𝗲𝗲 𝗙𝗶𝗿𝗲 𝘃𝗶𝗱𝗲𝗼 🎮\n" +
        "├ 𝟭𝟳. 𝗙𝗼𝗼𝘁𝗕𝗮𝗹𝗹 𝘃𝗶𝗱𝗲𝗼 ⚽\n" +
        "├ 𝟭𝟴. 𝗚𝗶𝗿𝗹 𝘃𝗶𝗱𝗲𝗼 💃\n" +
        "└ 𝟭𝟵. 𝗙𝗿𝗶𝗲𝗻𝗱𝘀 𝗩𝗶𝗱𝗲𝗼 👬\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "📍 𝗣𝗮𝗴𝗲 [ 𝟮/𝟮 ] ➪ 𝗕𝗮𝗰𝗸 !𝗮𝗹𝗯𝘂𝗺";

      await api.sendMessage(
        message,
        event.threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        },
        event.messageID,
      );
    }

    const validCommands = ["cartoon", "photo", "lofi", "sad", "islamic", "funny", "horny", "anime", "love", "baby", "lyrics", "sigma", "aesthetic", "cat", "flower", "ff", "sex", "girl", "football", "friend"];
    
    if (args[0] === "list") {
      try {
        const res = await axios.get(`${await baseApiUrl()}/album?list=dipto`);
        const data = res.data.data;
        const videoCount = data.match(/\d+/g).reduce((acc, num) => acc + parseInt(num), 0);
        api.sendMessage(`𝘁𝗼𝘁𝗮𝗹 𝘃𝗶𝗱𝗲𝗼 𝗰𝗼𝘂𝗻𝘁: ${videoCount}`, event.threadID, event.messageID);
      } catch (error) {
        api.sendMessage(`${error}`, event.threadID, event.messageID);
      }
    }

    if (args[0] === "listAll" || args[0] === "listall") {
      try {
        const lRes = await axios.get(`${await baseApiUrl()}/album?list=dipto`);
        const data = lRes.data.data;
        const videoCount = data.match(/\d+/g).reduce((acc, num) => acc + parseInt(num), 0);
        api.sendMessage(`🖤 𝗧𝗼𝘁𝗮𝗹 𝗮𝗹𝗯𝘂𝗺 𝗹𝗶𝘀𝘁 🩵\n\n${data}\n\n𝘁𝗼𝘁𝗮𝗹 𝘃𝗶𝗱𝗲𝗼 𝗰𝗼𝘂𝗻𝘁: ${videoCount}`, event.threadID, event.messageID);
      } catch (error) {
        api.sendMessage(`${error}`, event.threadID, event.messageID);
      }
    }

    const d1 = args[1] ? args[1].toLowerCase() : "";
    if (d1 && validCommands.includes(d1) && event.messageReply && event.messageReply.attachments) {
      api.setMessageReaction("👀", event.messageID, (err) => {}, true);
      const URL = event.messageReply.attachments[0].url;
      let query = d1 === "cartoon" ? "addVideo" : d1 === "flower" ? "addBaby" : "add" + d1.charAt(0).toUpperCase() + d1.slice(1);
      
      try {
        const response = await axios.get(`${await baseApiUrl()}/drive?url=${encodeURIComponent(URL)}`);
        const imgurLink = response.data.fileUrl;
        const svRes = await axios.get(`${await baseApiUrl()}/album?add=${query}&url=${imgurLink}`);
        api.sendMessage(`✅ | ${svRes.data.data}\n🔰 | ${svRes.data.data2}\n🔥 | URL: ${imgurLink}`, event.threadID, event.messageID);
      } catch (error) {
        api.sendMessage(`Failed to add media.\n${error}`, event.threadID, event.messageID);
      }
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const admin = "100044327656712";
    api.unsendMessage(Reply.messageID);
    
    if (event.type == "message_reply") {
      const reply = parseInt(event.body);
      let query, cp;

      const options = {
        1: ["funny", "It's your funny video 😆"],
        2: ["islamic", "It's your Islamic video 🌸"],
        3: ["sad", "It's your sad video 🥹"],
        4: ["anime", "It's your anime video 😍"],
        5: ["video", "It's your cartoon video 😚"],
        6: ["lofi", "It's your lofi video 🥳"],
        7: ["horny", "It's your horny video 🥵"],
        8: ["love", "It's your love video 😍"],
        9: ["baby", "It's your baby video 😩"],
        10: ["photo", "It's your random photo 😀"],
        11: ["aesthetic", "It's your aesthetic video 🫠"],
        12: ["sigma", "It's your sigma video 🫡"],
        13: ["lyrics", "It's your lyrical video 😌"],
        14: ["cat", "It's your cat video 😙"],
        15: ["sex", "It's your sex video 😙"],
        16: ["ff", "It's your ff video 😙"],
        17: ["football", "It's your football 😙"],
        18: ["girl", "It's your girl video 😙"],
        19: ["friend", "It's your friend video 😙"]
      };

      if (options[reply]) {
        if ((reply === 7 || reply === 15) && event.senderID !== admin) {
          return api.sendMessage("Admin only option! ❌", event.threadID, event.messageID);
        }
        [query, cp] = options[reply];
      } else {
        return api.sendMessage("🔰 | Please reply with a valid number (1-19).", event.threadID, event.messageID);
      }

      try {
        const res = await axios.get(`${await baseApiUrl()}/album?type=${query}`);
        const imgUrl = res.data.data;
        const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer", headers: { 'User-Agent': 'Mozilla/5.0' } });
        const filename = __dirname + `/assets/dipto_${Date.now()}.mp4`;
        
        if (!fs.existsSync(__dirname + '/assets')) fs.mkdirSync(__dirname + '/assets');
        fs.writeFileSync(filename, Buffer.from(imgRes.data, "binary"));
        
        api.sendMessage({
          body: `${cp}\n\n𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗨𝗿𝗹: ${imgUrl}`,
          attachment: fs.createReadStream(filename)
        }, event.threadID, () => fs.unlinkSync(filename), event.messageID);
      } catch (error) {
        api.sendMessage("API didn't return a video link. Try again later.", event.threadID, event.messageID);
      }
    }
  }
};
