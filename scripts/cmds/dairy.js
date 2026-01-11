const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

const dairySchema = new mongoose.Schema({
  userID: { type: String, required: true },
  userName: String,
  entries: [
    {
      page: Number,
      headline: String,
      content: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

const DairyModel = mongoose.models.Dairy || mongoose.model("Dairy", dairySchema);

module.exports = {
  config: {
    name: "dairy",
    version: "4.2.0",
    role: 0,
    author: "NAWAB",
    description: "Personal diary with professional UI (Group Access)",
    category: "user",
    guide: "{pn} add [Headline] <Content> | {pn} delete [Headline] | {pn} [page number]",
    countDown: 2
  },

  onLoad: async function () {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;
    
    const info = await api.getUserInfo(senderID);
    const name = info[senderID]?.name || "User";
    const currentTime = new Date().toLocaleString("en-US", { hour12: true, dateStyle: 'medium', timeStyle: 'short' });

    let userDairy = await DairyModel.findOne({ userID: senderID });

    // 1. Add Entry
    if (args[0] === "add") {
      const input = args.slice(1).join(" ");
      const regex = /\[(.*?)\]\s*<(.*)>/s;
      const match = input.match(regex);
      if (!match) return message.reply("📑 Usage: !dairy add [Headline] <Message>");

      const headline = match[1];
      const contentWithTime = `${match[2]}\n\n[ Saved on: ${currentTime} ]`;

      if (!userDairy) userDairy = new DairyModel({ userID: senderID, userName: name, entries: [] });
      userDairy.entries.push({ page: userDairy.entries.length + 1, headline, content: contentWithTime });
      await userDairy.save();
      return message.reply(`✅ Saved to Page ${userDairy.entries.length}!\n📌 Headline: ${headline}`);
    }

    // 2. Delete Entry
    if (args[0] === "delete") {
        const headlineToDel = args.slice(1).join(" ").replace(/[\[\]]/g, "");
        if (!userDairy || userDairy.entries.length === 0) return message.reply("📭 Your diary is empty.");
        
        const initialLen = userDairy.entries.length;
        userDairy.entries = userDairy.entries.filter(e => e.headline.toLowerCase() !== headlineToDel.toLowerCase());
        
        if (userDairy.entries.length === initialLen) return message.reply("❌ Headline not found.");
        
        userDairy.entries.forEach((e, i) => e.page = i + 1);
        await userDairy.save();
        return message.reply(`🗑️ Entry '${headlineToDel}' deleted and pages re-indexed.`);
    }

    // 3. View Specific Page (Directly in Group)
    if (args[0] && !isNaN(args[0])) {
      const pageNum = parseInt(args[0]);
      if (!userDairy || !userDairy.entries[pageNum - 1]) return message.reply(`❌ Page ${pageNum} is empty.`);

      const entry = userDairy.entries[pageNum - 1];
      const msg = `╭────── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──────╮\n` +
                  `      📖  𝐌𝐘 𝐏𝐄𝐑𝐒𝐎𝐍𝐀𝐋 𝐃𝐈𝐀𝐑𝐘\n` +
                  `╰────── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──────╯\n` +
                  `📑 𝐏𝐚𝐠𝐞: ${entry.page}\n` +
                  `📌 𝐇𝐞𝐚𝐝𝐥𝐢𝐧𝐞: ${entry.headline.toUpperCase()}\n` +
                  `────────────────────────\n\n` +
                  `${entry.content}\n\n` +
                  `────────────────────────\n` +
                  `✍️ 𝐀𝐮𝐭𝐡𝐨𝐫: ${name}\n` +
                  `🕒 𝐕𝐢𝐞𝐰𝐞𝐝: ${currentTime}`;
      
      return message.reply(msg);
    }

    // 4. List Collection
    if (!userDairy || userDairy.entries.length === 0) return message.reply("📭 Your diary is empty. Use '!dairy add [Headline] <Content>' to write.");

    let listMsg = `╔═════════════════╗\n   📂 𝐃𝐈𝐀𝐑𝐘 𝐂𝐎𝐋𝐋𝐄𝐂𝐓𝐈𝐎𝐍\n╚═════════════════╝\n`;
    userDairy.entries.forEach(e => { listMsg += `[ ${e.page} ] ➜ ${e.headline}\n`; });
    listMsg += `\n──────────────────\n✍️ 𝐔𝐬𝐞𝐫: ${name}\n💡 Reply with Number to read full entry.`;

    return api.sendMessage(listMsg, threadID, (err, info) => {
      global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID });
    }, messageID);
  },

  onReply: async function ({ api, event, handleReply, message }) {
    const { body, senderID } = event;
    if (senderID !== handleReply.author) return;

    if (!isNaN(body)) {
      const userDairy = await DairyModel.findOne({ userID: senderID });
      const info = await api.getUserInfo(senderID);
      const name = info[senderID]?.name || "User";
      
      const pageNum = parseInt(body);
      const currentTime = new Date().toLocaleString("en-US", { hour12: true, dateStyle: 'medium', timeStyle: 'short' });

      if (!userDairy || !userDairy.entries[pageNum - 1]) return message.reply(`❌ Page ${pageNum} doesn't exist.`);

      const entry = userDairy.entries[pageNum - 1];
      const msg = `╭────── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──────╮\n` +
                  `      📖  𝐌𝐘 𝐏𝐄𝐑𝐒𝐎𝐍𝐀𝐋 𝐃𝐈𝐀𝐑𝐘\n` +
                  `╰────── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──────╯\n` +
                  `📑 𝐏𝐚𝐠𝐞: ${entry.page}\n` +
                  `📌 𝐇𝐞𝐚𝐝𝐥𝐢𝐧𝐞: ${entry.headline.toUpperCase()}\n` +
                  `────────────────────────\n\n` +
                  `${entry.content}\n\n` +
                  `────────────────────────\n` +
                  `✍️ 𝐀𝐮𝐭𝐡𝐨𝐫: ${name}\n` +
                  `🕒 𝐓𝐢𝐦𝐞: ${currentTime}`;

      return message.reply(msg);
    }
  }
};
    
