const fs = require("fs-extra");

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands", "all"],
    version: "5.0",
    author: "AkHi",
    shortDescription: "Show categorized commands",
    longDescription: "Displays a clean and premium-styled categorized list of commands with pagination.",
    category: "system",
    guide: "{pn} [page] or {pn} [command name]"
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;
    const categories = {};
    const itemsPerPage = 10; // এক পেজে কয়টি ক্যাটাগরি থাকবে

    // ১. ক্যাটাগরি অনুযায়ী কমান্ডগুলো সাজানো
    for (const [name, cmd] of allCommands) {
      const cat = (cmd.config.category || "others").toLowerCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    // ২. নির্দিষ্ট কমান্ডের তথ্য দেখা (যদি ইউজার !help [cmd] লেখে)
    if (args[0] && isNaN(args[0])) {
      const query = args[0].toLowerCase();
      const cmd = allCommands.get(query) || [...allCommands.values()].find((c) => (c.config.aliases || []).includes(query));
      
      if (!cmd) return message.reply(`❌ Command "${query}" not found.`);

      const { name, version, author, guide, category, role, shortDescription, aliases } = cmd.config;
      const usage = typeof guide === "string" ? guide.replace(/{pn}/g, prefix + name) : prefix + name;

      return message.reply(
        `╭───[ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 ]\n` +
        `├‣ 𝗡𝗮𝗺𝗲: ${name}\n` +
        `├‣ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${version}\n` +
        `├‣ 𝗔𝘂𝘁𝗵𝗼𝗿: ${author}\n` +
        `├‣ 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${category}\n` +
        `├‣ 𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻: ${role == 2 ? "Admin" : role == 1 ? "Group Admin" : "User"}\n` +
        `├‣ 𝗔𝗹𝗶𝗮𝘀𝗲𝘀: ${aliases ? aliases.join(", ") : "None"}\n` +
        `├‣ 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${shortDescription || "No info"}\n` +
        `╰‣ 𝗨𝘀𝗮𝗴𝗲: ${usage}`
      );
    }

    // ৩. পেজ অনুযায়ী হেল্প মেনু তৈরি
    const sortedCats = Object.keys(categories).sort();
    const totalPages = Math.ceil(sortedCats.length / itemsPerPage);
    let page = parseInt(args[0]) || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageCats = sortedCats.slice(start, end);

    let msg = `✨ [ Guide For Beginners - Page ${page} ] ✨\n\n`;

    for (const cat of pageCats) {
      const catName = cat.toUpperCase();
      // ক্যাটাগরি নাম অনুযায়ী ইমোজি বা স্টাইল ফিক্স
      const headerMap = {
        ai: "𝗜𝗠𝗔𝗚𝗘 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥",
        chat: "𝗖𝗛𝗔𝗧 𝗔𝗜",
        utility: "𝗨𝗧𝗜𝗟𝗜𝗧𝗬",
        game: "𝗚𝗔𝗠𝗘",
        boxchat: "𝗕𝗢𝗫 𝗖𝗛𝗔𝗧",
        system: "𝗦𝗬𝗦𝗧𝗘𝗠",
        media: "𝗠𝗘𝗗𝗜𝗔",
        downloader: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥"
      };

      const title = headerMap[cat] || catName;
      msg += `╭──── [ ${title} ]\n`;
      
      // কমান্ডগুলো ছোট ছোট খণ্ডে ভাগ করে সাজানো (৩টি করে এক লাইনে)
      const cmds = categories[cat].sort();
      let cmdLine = "│ ";
      for (let i = 0; i < cmds.length; i++) {
        cmdLine += `✧ ${cmds[i]}`;
        if ((i + 1) % 3 === 0 && i !== cmds.length - 1) {
          msg += cmdLine + "\n│ ";
          cmdLine = "";
        }
      }
      msg += cmdLine + "\n╰───────────────◊\n";
    }

    // ৪. ফুটার অংশ
    msg += `\n╭─『 YOUR CITTI BOT 』\n`;
    msg += `╰‣ Total commands: ${allCommands.size}\n`;
    msg += `╰‣ Page ${page} of ${totalPages}\n`;
    msg += `╰‣ A Personal Facebook Bot\n`;
    msg += `╰‣ ADMIN: AkHi\n`;
    msg += `╰‣ Type ${prefix}help [name] to see details.`;

    return message.reply(msg);
  }
};
	
