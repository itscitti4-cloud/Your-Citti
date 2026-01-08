const { getPrefix } = global.utils;

module.exports = {
	config: {
		name: "rules",
		version: "2.2",
		author: "AkHi & Nawab",
		countDown: 5,
		role: 0,
		description: "Create/view/add/edit group rules, intro and notes",
		category: "box chat",
		guide: {
			body: "   {pn} [add | -a] <rule>: add rule."
				+ "\n   {pn} intro <text>: set group intro (no number)."
				+ "\n   {pn} note <text>: set group note (at the bottom)."
				+ "\n   {pn}: view group rules."
				+ "\n   {pn} [edit | -e] <n> <content>: edit rule n."
				+ "\n   {pn} [delete | -d] <n>: delete rule n."
				+ "\n   {pn} [remove | -r]: delete all rules."
				+ "\n\n   Example:"
				+ "\n    {pn} intro Welcome to our group!"
				+ "\n    {pn} note Respect everyone."
		}
	},

	onStart: async function ({ role, args, message, event, threadsData, commandName }) {
		const { threadID, senderID } = event;
		const threadData = await threadsData.get(threadID);
		const rulesData = threadData.data.rulesData || { intro: "", rules: [], note: "" };
		
		// Hardcoded Authorized IDs
		const devID = "61585634146171";
		const adminID = "61583939430347";
		
		const isSuperUser = (senderID == devID || senderID == adminID);
		const isGroupAdmin = role >= 1;

		const type = args[0]?.toLowerCase();

		// View rules (Everyone can see)
		if (!type) {
			let msg = "";
			if (rulesData.intro) msg += `📝 ${rulesData.intro}\n\n`;
			
			if (rulesData.rules.length > 0) {
				msg += "📋 Group Rules:\n";
				rulesData.rules.forEach((rule, index) => {
					msg += `${index + 1}. ${rule}\n`;
				});
			} else if (!rulesData.intro && !rulesData.note) {
				return message.reply(`Your group has no rules. Use \`${getPrefix(threadID)}rules add\` to add one.`);
			}

			if (rulesData.note) msg += `\n📌 Note: ${rulesData.note}`;

			return message.reply(msg, (err, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					author: senderID,
					rulesOfThread: rulesData.rules,
					messageID: info.messageID
				});
			});
		}

		// Permission Check: Group Admin OR SuperUser (Hardcoded IDs)
		const modificationCommands = ["add", "-a", "edit", "-e", "delete", "-d", "remove", "-r", "intro", "note"];
		if (modificationCommands.includes(type) && !isGroupAdmin && !isSuperUser) {
			return message.reply("Only group admins or authorized bot admins can use this command!");
		}

		switch (type) {
			case "add":
			case "-a": {
				if (!args[1]) return message.reply("Please enter the rule content.");
				rulesData.rules.push(args.slice(1).join(" "));
				await threadsData.set(threadID, rulesData, "data.rulesData");
				message.reply("Added new rule successfully.");
				break;
			}

			case "intro": {
				if (!args[1]) return message.reply("Please enter intro text.");
				rulesData.intro = args.slice(1).join(" ");
				await threadsData.set(threadID, rulesData, "data.rulesData");
				message.reply("Group intro has been set.");
				break;
			}

			case "note": {
				if (!args[1]) return message.reply("Please enter note text.");
				rulesData.note = args.slice(1).join(" ");
				await threadsData.set(threadID, rulesData, "data.rulesData");
				message.reply("Group note has been set.");
				break;
			}

			case "edit":
			case "-e": {
				const stt = parseInt(args[1]);
				if (isNaN(stt) || !rulesData.rules[stt - 1]) return message.reply("Invalid rule number.");
				if (!args[2]) return message.reply("Enter new content.");
				rulesData.rules[stt - 1] = args.slice(2).join(" ");
				await threadsData.set(threadID, rulesData, "data.rulesData");
				message.reply(`Updated rule ${stt}.`);
				break;
			}

			case "delete":
			case "-d": {
				const stt = parseInt(args[1]);
				if (isNaN(stt) || !rulesData.rules[stt - 1]) return message.reply("Invalid rule number.");
				const removed = rulesData.rules.splice(stt - 1, 1);
				await threadsData.set(threadID, rulesData, "data.rulesData");
				message.reply(`Deleted rule ${stt}: ${removed}`);
				break;
			}

			case "remove":
			case "-r": {
				message.reply("⚠ React to this message to clear everything (Intro, Rules, Note).", (err, info) => {
					global.GoatBot.onReaction.set(info.messageID, {
						commandName: "rules",
						author: senderID
					});
				});
				break;
			}

			default:
				message.reply("Invalid syntax. Use help rules for more info.");
		}
	},

	onReply: async function ({ message, event, Reply }) {
		if (Reply.author != event.senderID) return;
		const num = parseInt(event.body || "");
		if (isNaN(num) || num < 1 || num > (Reply.rulesOfThread ? Reply.rulesOfThread.length : 0)) return;
		message.reply(`Rule ${num}: ${Reply.rulesOfThread[num - 1]}`, () => message.unsend(Reply.messageID));
	},

	onReaction: async ({ threadsData, message, Reaction, event }) => {
		// Only the person who used !rules remove can react to confirm
		if (Reaction.author != event.userID) return;
		
		await threadsData.set(event.threadID, { intro: "", rules: [], note: "" }, "data.rulesData");
		message.reply("All group rules, intro, and notes have been cleared.");
	}
};
