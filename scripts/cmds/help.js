const fs = require("fs-extra");

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands", "all"],
    version: "5.2",
    author: "AkHi",
    shortDescription: "Show categorized commands",
    longDescription: "Displays a clean and premium-styled categorized list of commands with pagination.",
    category: "system",
    guide: "{pn} [page] or {pn} [command name]"
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;
    const categories = {};
    const itemsPerPage = 4; // প্রতি পেজে ৪টি ক্যাটাগরি

    // ১. ক্যাটাগরি অনুযায়ী কমান্ড গুছানো
    for (const [name, cmd] of allCommands) {
      const cat = (cmd.config.category || "others").toLowerCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    // ২. নির্দিষ্ট কমান্ড ডিটেইলস (নতুন ফরম্যাটে)
    if (args[0] && isNaN(args[0])) {
      const query = args[0].toLowerCase();
      const cmd = allCommands.get(query) || [...allCommands.values()].find((c) => (c.config.aliases || []).includes(query));
      
      if (!cmd) return message.reply(`❌ Command "${query}" not found.`);

      const { name, author, guide, role, shortDescription, aliases } = cmd.config;
      const usage = typeof guide === "string" ? guide.replace(/{pn}/g, prefix + name) : prefix + name;
      const permission = role == 2 ? "Bot Admin" : role == 1 ? "Group Admin" : "User";

      let helpDetail = `╭──✦ [ Command: ${name.toUpperCase()} ]\n`;
      helpDetail += `├‣ 📜 Name: ${name}\n`;
      helpDetail += `├‣ 🪶 Aliases: ${aliases && aliases.length > 0 ? aliases.join(", ") : "None"}\n`;
      helpDetail += `├‣ 👤 Author: ${author || "Unknown"}\n`;
      helpDetail += `╰‣ 🔑 Permission: ${permission}\n\n`;

      helpDetail += `╭─✦ [ INFORMATION ]\n`;
      helpDetail += `├‣ Cost: 0\n`; // GoatBot-এ সাধারণত কস্ট ডিফল্ট ০ থাকে
      helpDetail += `├‣ Description:\n`;
      helpDetail += `│   ${shortDescription || "No info"}\n`;
      helpDetail += `╰‣ Guide: ${usage}\n\n`;

      helpDetail += `╭─✦ [ SETTINGS ]\n`;
      helpDetail += `├‣ 🚩 Prefix Required: ✓ Required\n`;
      helpDetail += `╰‣ ⚜ Premium: ✗ Free to Use`;

      return message.reply(helpDetail);
    }

    // ৩. পেজিনেশন লজিক (হেল্প মেনু)
    const sortedCats = Object.keys(categories).sort();
    const totalPages = Math.ceil(sortedCats.length / itemsPerPage);
    let page = parseInt(args[0]) || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageCats = sortedCats.slice(start, end);

    let msg = `━━━🌸 YOUR CITTI BOT GUIDE 🌸━━━\n\n`;

    for (const cat of pageCats) {
      const catTitle = cat.toUpperCase();
      const cmds = categories[cat].sort();
      
      msg += `╭──『 ${catTitle} 』\n`;
      msg += `× ${cmds.join(" × ")}\n`;
      msg += `╰────────────◊\n\n`;
    }

    // ৪. ফুটার অংশ
    msg += `╭─『 YOUR BABY BOT 』\n`;
    msg += ` ➥ Total commands: ${allCommands.size}\n`;
    msg += ` ➥ Page ${page} of ${totalPages}\n`;
    msg += ` ➥ A Personal Facebook Bot\n`;
    msg += ` ➥ ADMIN: AkHi\n`;
    msg += ` ➥ If you Don't know how to use commands\n`;
    msg += ` Then Type ${prefix}help [commandName] to see\n`;
    msg += ` command usages\n\n`;
    msg += `➥Use: ${prefix}callad to talk with bot admins '_'`;

    return message.reply(msg);
  }
};
