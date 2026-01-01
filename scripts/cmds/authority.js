module.exports = {
  config: {
    name: "authority",
    aliases: ["auth", "admins", "authlist"],
    version: "1.4",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "View bot authority list",
    longDescription: "Shows Developers, Premium Users, Admins, and Group Admins with names and IDs.",
    category: "information",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData, message, threadsData }) {
    const fs = require("fs-extra");
    const path = require("path");
    
    try {
      const configPath = path.join(process.cwd(), "config.json");
      const config = fs.readJsonSync(configPath);

      // প্রথম ৩টি রোল config.json থেকে আসবে
      const roles = [
        { name: "DEVELOPERS (Role 4)", key: "devUsers", icon: "👑" },
        { name: "PREMIUM USERS (Role 3)", key: "premiumUsers", icon: "💎" },
        { name: "BOT ADMINS (Role 2)", key: "adminBot", icon: "🛡️" }
      ];

      let msg = "✨ ━━━━ [ 𝗔𝗨𝗧𝗛𝗢𝗥𝗜𝗧𝗬 ] ━━━━ ✨\n\n";

      // ১. ডেভেলপার, প্রিমিয়াম এবং বট এডমিন প্রসেসিং
      for (const role of roles) {
        const ids = config[role.key] || [];
        msg += `${role.icon} ─── ${role.name} ───\n`;

        if (ids.length > 0) {
          for (let i = 0; i < ids.length; i++) {
            const uid = ids[i].toString();
            const user = await usersData.get(uid);
            const userName = user ? user.name : "Facebook User";
            msg += `  ${i + 1}. ${userName}\n     ID: ${uid}\n`;
          }
        } else {
          msg += "  ( No users assigned )\n";
        }
        msg += "\n";
      }

      // ২. গ্রুপ এডমিন প্রসেসিং (এটি বর্তমান থ্রেড থেকে ডাটা নেবে)
      msg += `⚙️ ─── GROUP ADMINS (Role 1) ───\n`;
      const threadInfo = await api.getThreadInfo(event.threadID);
      const adminIDs = threadInfo.adminIDs.map(item => item.id);

      if (adminIDs.length > 0) {
        for (let j = 0; j < adminIDs.length; j++) {
          const uid = adminIDs[j].toString();
          const user = await usersData.get(uid);
          const userName = user ? user.name : "Facebook User";
          msg += `  ${j + 1}. ${userName}\n     ID: ${uid}\n`;
        }
      } else {
        msg += "  ( No admins found )\n";
      }

      msg += "\n━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      msg += "⚡ Status: System Online\n";
      msg += "🕒 Date: " + new Date().toLocaleDateString();
      
      return message.reply(msg);
    } catch (error) {
      console.error(error);
      return message.reply("❌ | Error: Could not load authority data.");
    }
  }
};
