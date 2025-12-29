const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "1.4",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: "Change the command prefix for your chat box or the entire system (admin only).",
		category: "bot",
		guide: "{pn} <new prefix>: change new prefix in your box chat"
				+ "\n   Example:"
				+ "\n    {pn} #"
				+ "\n\n   {pn} <new prefix> -g: change new prefix in system bot (only admin bot)"
				+ "\n   Example:"
				+ "\n    {pn} # -g"
				+ "\n\n   {pn} reset: change prefix in your box chat to default"
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData }) {
		if (!args[0])
			return message.SyntaxError();

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(`Your prefix has been reset to default: ${global.GoatBot.config.prefix}`);
		}

		const newPrefix = args[0];
		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix
		};

		if (args[1] === "-g") {
			if (role < 2)
				return message.reply("Only admin can change the prefix of the system bot.");
			else
				formSet.setGlobal = true;
		} else {
			formSet.setGlobal = false;
		}

		const msg = args[1] === "-g" 
			? "Please react to this message to confirm changing the system bot prefix." 
			: "Please react to this message to confirm changing the prefix in your chat.";

		return message.reply(msg, (err, info) => {
			formSet.messageID = info.messageID;
			global.GoatBot.onReaction.set(info.messageID, formSet);
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author)
			return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(`Changed the prefix of the system bot to: ${newPrefix}`);
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(`Changed the prefix in your chat to: ${newPrefix}`);
		}
	},

	onChat: async function ({ event, message, usersData }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			const userName = await usersData.getName(event.senderID);
			const botName = global.GoatBot.config.nickNameBot || "Bot";
			const globalPrefix = global.GoatBot.config.prefix;
			const threadPrefix = utils.getPrefix(event.threadID);

			const replyMsg = `👋 Hey ${userName}, did you ask for my prefix?\n`
				+ `➥ 🌐 Global: ${globalPrefix}\n`
				+ `➥ 💬 This Chat: ${threadPrefix}\n`
				+ `🦋 Owner: https://www.facebook.com/profile.php?id=61583939430347\n`
				+ `I'm ${botName} at your service 🫡`;

			return message.reply(replyMsg);
		}
	}
};
return async () => {
																const userName = await usersData.getName(event.senderID);
																const botName = global.GoatBot.config.nickNameBot || "Bot";
																return message.reply(getLang("myPrefix", userName, global.GoatBot.config.prefix, utils.getPrefix(event.threadID), botName));
												};
				}
};
