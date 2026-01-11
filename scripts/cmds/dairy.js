const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://shahryarsabu_db_user:7jYCAFNDGkemgYQI@cluster0.rbclxsq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
const MASTER_CODE = "NAWAB"; // এই কোডটি দিয়ে পাসওয়ার্ড রিসেট করা যাবে

const dairySchema = new mongoose.Schema({
  userID: { type: String, required: true },
  userName: String,
  password: { type: String, default: null },
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
    version: "4.1.0",
    role: 0,
    author: "NAWAB",
    description: "Secure diary with Private Delivery and Reset Option",
    category: "user",
    guide: "{pn} add [Headline] <Content> | {pn} lock [pass] | {pn} reset [master] [newpass] | {pn} [page]",
    countDown: 2
  },

  onLoad: async function () {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;
    
    // ফিক্স: Users.getData এর পরিবর্তে api.getUserInfo ব্যবহার
    const info = await api.getUserInfo(senderID);
    const name = info[senderID]?.name || "User";
    
    const currentTime = new Date().toLocaleString("en-US", { hour12: true, dateStyle: 'medium', timeStyle: 'short' });

    let userDairy = await DairyModel.findOne({ userID: senderID });

    // 1. Password Reset System
    if (args[0] === "reset") {
      const code = args[1];
      const newPass = args[2];
      if (code !== MASTER_CODE) return message.reply("❌ Invalid Master Code! You cannot reset the password.");
      if (!newPass) return message.reply("📑 Usage: !dairy reset [MasterCode] [NewPassword]");
      
      if (userDairy) {
        userDairy.password = newPass;
        await userDairy.save();
      }
      return message.reply(`✅ Password reset successfully! Your new password is: ${newPass}`);
    }

    // 2. Setup Lock
    if (args[0] === "lock") {
      const newPass = args[1];
      if (!newPass) return message.reply("📑 Usage: !dairy lock [password]");
      if (!userDairy) {
        userDairy = new DairyModel({ userID: senderID, userName: name, password: newPass, entries: [] });
      } else {
        userDairy.password = newPass;
      }
      await userDairy.save();
      return message.reply(`🔐 Lock enabled! Your secret notes are now safe.`);
    }

    // Lock Check
    if (userDairy && userDairy.password && args[0] !== "unlock" && args[0] !== "reset") {
      return message.reply("🔒 Your Diary is locked. Use '!dairy unlock [password]' to access.");
    }

    // 3. Unlock
    if (args[0] === "unlock") {
      const inputPass = args[1];
      if (!userDairy || !userDairy.password) return message.reply("❌ No password set.");
      if (inputPass !== userDairy.password) return message.reply("⚠️ Wrong password!");
      return message.reply("🔓 Access Granted for this session!");
    }

    // 4. Add Entry (Group Action)
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

    // 5. Delete Entry (Group Action)
    if (args[0] === "delete") {
        const headlineToDel = args.slice(1).join(" ").replace(/[\[\]]/g, "");
        if (!userDairy || userDairy.entries.length === 0) return message.reply("📭 Empty diary.");
        userDairy.entries = userDairy.entries.filter(e => e.headline.toLowerCase() !== headlineToDel.toLowerCase());
        userDairy.entries.forEach((e, i) => e.page = i + 1);
        await userDairy.save();
        return message.reply(`🗑️ Entry '${headlineToDel}' deleted.`);
    }

    // 6. View Specific Page (Private Inbox Delivery)
    if (args[0] && !isNaN(args[0])) {
      const pageNum = parseInt(args[0]);
      if (!userDairy || !userDairy.entries[pageNum - 1]) return message.reply(`❌ Page ${pageNum} is empty.`);

      const entry = userDairy.entries[pageNum - 1];
      const privateMsg = `╭────── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──────╮\n      📖  𝐏𝐀𝐆𝐄 ${entry.page} 𝐃𝐄𝐓𝐀𝐈𝐋𝐒\n╰────── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──────╯\n📌 𝐇𝐞𝐚𝐝𝐥𝐢𝐧𝐞: ${entry.headline.toUpperCase()}\n────────────────────────\n\n${entry.content}\n\n────────────────────────\n✍️ 𝐀𝐮𝐭𝐡𝐨𝐫: Shahryar Sabu\n🕒 𝐕𝐢𝐞𝐰𝐞𝐝 𝐚𝐭: ${currentTime}`;
      
      api.sendMessage(privateMsg, senderID, (err) => {
        if (err) return message.reply("❌ I couldn't send you a inbox. Please check if your inbox is open.");
        return message.reply(`📬 𝐂𝐡𝐞𝐜𝐤 𝐲𝐨𝐮𝐫 𝐈𝐧𝐛𝐨𝐱! I have sent Page ${pageNum} to your inbox.`);
      });
      return;
    }

    // 7. List Collection (Group Action)
    if (!userDairy || userDairy.entries.length === 0) return message.reply("📭 Your diary is empty.");

    let listMsg = `╔═════════════════╗\n   📂 𝐃𝐈𝐀𝐑𝐘 𝐂𝐎𝐋𝐋𝐄𝐂𝐓𝐈𝐎𝐍\n╚═════════════════╝\n`;
    userDairy.entries.forEach(e => { listMsg += `[ ${e.page} ] ➜ ${e.headline}\n`; });
    listMsg += `\n──────────────────\n✍️ 𝐔𝐬𝐞𝐫: ${name}\n💡 Reply with Number to see details in Inbox.`;

    return api.sendMessage(listMsg, threadID, (err, info) => {
      global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID });
    }, messageID);
  },

  onReply: async function ({ api, event, handleReply, message }) {
    const { body, senderID } = event;
    if (senderID !== handleReply.author) return;

    if (!isNaN(body)) {
      const userDairy = await DairyModel.findOne({ userID: senderID });
      
      // ফিক্স: এখানেও api.getUserInfo ব্যবহার করা হয়েছে
      const info = await api.getUserInfo(senderID);
      const name = info[senderID]?.name || "User";
      
      const pageNum = parseInt(body);
      const currentTime = new Date().toLocaleString("en-US", { hour12: true, dateStyle: 'medium', timeStyle: 'short' });

      if (!userDairy || !userDairy.entries[pageNum - 1]) return message.reply(`❌ Page ${pageNum} doesn't exist.`);

      const entry = userDairy.entries[pageNum - 1];
      const privateMsg = `╭────── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──────╮\n      📖  𝐏𝐀𝐆𝐄 ${entry.page} 𝐃𝐄𝐓𝐀𝐈𝐋𝐒\n╰────── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──────╯\n📌 𝐇𝐞𝐚𝐝𝐥𝐢𝐧𝐞: ${entry.headline.toUpperCase()}\n────────────────────────\n\n${entry.content}\n\n────────────────────────\n✍️ 𝐀𝐮𝐭𝐡𝐨𝐫: Shahryar Sabu\n🕒 𝐓𝐢𝐦𝐞: ${currentTime}`;

      api.sendMessage(privateMsg, senderID, (err) => {
        if (err) return message.reply("❌ Failed to send Private Message.");
        return message.reply(`📬 𝐒𝐞𝐧𝐭 𝐭𝐨 𝐈𝐧𝐛𝐨𝐱! Page ${pageNum} details have been sent to your inbox.`);
      });
    }
  }
};
