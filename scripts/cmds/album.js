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
    version: "1.0.1",
    role: 0,
    author: "AkHi",
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

      await api.sendMessage(message, event.threadID, (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }, event.messageID);
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
        "├ 𝟭𝟱. 𝗚𝗶𝗿𝗹 𝘃𝗶𝗱𝗲𝗼 💃\n" +
        "├ 𝟭𝟲. 𝗙𝗿𝗲𝗲 𝗙𝗶𝗿𝗲 𝘃𝗶𝗱𝗲𝗼 🎮\n" +
        "├ 𝟭𝟳. 𝗙𝗼𝗼𝘁𝗕𝗮𝗹𝗹 𝘃𝗶𝗱𝗲𝗼 ⚽\n" +
        "└ 𝟭𝟴. 𝗟𝗼𝘃𝗲 𝘃𝗶𝗱𝗲𝗼 ❤️\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "📍 𝗣𝗮𝗴𝗲 [ 𝟮/𝟮 ] ➪ 𝗕𝗮𝗰𝗸 !𝗮𝗹𝗯𝘂𝗺";

      await api.sendMessage(message, event.threadID, (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    api.unsendMessage(Reply.messageID);
    const reply = parseInt(event.body);

    const options = {
      1: ["funny", "Here is your funny video 😆"],
      2: ["islamic", "Here is your Islamic video 🌸"],
      3: ["sad", "Here is your sad video 🥹"],
      4: ["anime", "Here is your anime video 😍"],
      5: ["video", "Here is your cartoon video 😚"],
      6: ["lofi", "Here is your lofi video 🥳"],
      7: ["horny", "Here is your horny video 🥵"],
      8: ["love", "Here is your couple video 💍"],
      9: ["baby", "Here is your flower/baby video 🌷"],
      10: ["photo", "Here is your random photo 😀"],
      11: ["aesthetic", "Here is your aesthetic video 🫠"],
      12: ["sigma", "Here is your sigma video 🫡"],
      13: ["lyrics", "Here is your lyrical video 😌"],
      14: ["cat", "Here is your cat video 😙"],
      15: ["girl", "Here is your girl video 💃"],
      16: ["ff", "Here is your Free Fire video 🎮"],
      17: ["football", "Here is your football video ⚽"],
      18: ["love", "Here is your love video ❤️"]
    };

    if (!options[reply]) return api.sendMessage("🔰 | Please reply with a valid number.", event.threadID, event.messageID);

    try {
      const query = options[reply][0];
      const cp = options[reply][1];
      const res = await axios.get(`${await baseApiUrl()}/album?type=${query}`);
      const imgUrl = res.data.data;
      
      const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
      const filename = __dirname + `/assets/album_${Date.now()}.mp4`;
      
      if (!fs.existsSync(__dirname + '/assets')) fs.mkdirSync(__dirname + '/assets');
      fs.writeFileSync(filename, Buffer.from(imgRes.data, "binary"));
      
      return api.sendMessage({
        body: `${cp}\n\n𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗨𝗿𝗹: ${imgUrl}`,
        attachment: fs.createReadStream(filename)
      }, event.threadID, () => fs.unlinkSync(filename), event.messageID);
    } catch (error) {
      return api.sendMessage("API didn't return a video link for this category.", event.threadID, event.messageID);
    }
  }
};
                                              
