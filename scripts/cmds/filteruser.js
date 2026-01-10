function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = {
	config: {
		name: "filteruser",
		version: "1.7",
		author: "AkHi",
		countDown: 5,
		role: 1,
		description: {
			en: "filter group members by number of messages or locked account"
		},
		category: "box chat",
		guide: {
			en: "   {pn} [<number of messages> | die]"
		}
	},

	onStart: async function ({ api, args, threadsData, message, event, commandName }) {
		const { threadID, senderID, messageID } = event;
		
		// সরাসরি ফেসবুক থেকে ডাটা নিয়ে অ্যাডমিন চেক
		const threadInfo = await api.getThreadInfo(threadID);
		const botID = api.getCurrentUserID();
		if (!threadInfo.adminIDs.some(admin => admin.id === botID)) {
			return message.reply("⚠ | Please add the bot as a group admin to use this command.");
		}

		if (!isNaN(args[0])) {
			const minMsg = Number(args[0]);
			message.reply(`⚠ | Are you sure you want to delete group members with less than ${minMsg} messages?\nReact to this message to confirm.`, (err, info) => {
				global.GoatBot.onReaction.set(info.messageID, {
					author: senderID,
					messageID: info.messageID,
					minimum: minMsg,
					commandName
				});
			});
		}
		else if (args[0] == "die") {
			const membersBlocked = threadInfo.userInfo.filter(user => user.type !== "User");
			const errors = [];
			const success = [];
			
			for (const user of membersBlocked) {
				// অ্যাডমিনদের বাদ দিয়ে বাকিদের কিক করা
				if (!threadInfo.adminIDs.some(admin => admin.id == user.id)) {
					try {
						await api.removeUserFromGroup(user.id, threadID);
						success.push(user.id);
					}
					catch (e) {
						errors.push(user.name || user.id);
					}
					await sleep(700);
				}
			}

			let msg = "";
			if (success.length > 0) msg += `✓ | Successfully removed ${success.length} members with unavailable accounts.\n`;
			if (errors.length > 0) msg += `✗ | Failed to kick ${errors.length} members: ${errors.join(", ")}\n`;
			if (msg == "") msg += "✓ | There are no members with locked accounts.";
			message.reply(msg);
		}
		else {
			message.reply("Invalid syntax! Use: !filteruser [number] or !filteruser die");
		}
	},

	onReaction: async function ({ api, Reaction, event, threadsData, message }) {
		const { minimum = 1, author } = Reaction;
		if (event.userID != author) return;

		const { threadID } = event;
		const botID = api.getCurrentUserID();
		
		// রিয়েল-টাইম অ্যাডমিন লিস্ট চেক
		const threadInfo = await api.getThreadInfo(threadID);
		if (!threadInfo.adminIDs.some(admin => admin.id === botID)) {
			return message.reply("⚠ | Bot is no longer an admin. Action cancelled.");
		}

		const threadData = await threadsData.get(threadID);
		const membersCountLess = threadData.members.filter(member =>
			member.count < minimum
			&& member.inGroup == true
			&& member.userID != botID
			&& !threadInfo.adminIDs.some(admin => admin.id == member.userID)
		);

		const errors = [];
		const success = [];

		for (const member of membersCountLess) {
			try {
				await api.removeUserFromGroup(member.userID, threadID);
				success.push(member.userID);
			}
			catch (e) {
				errors.push(member.name || member.userID);
			}
			await sleep(700);
		}

		let msg = "";
		if (success.length > 0) msg += `✓ | Successfully removed ${success.length} members with less than ${minimum} messages.\n`;
		if (errors.length > 0) msg += `✗ | Could not kick ${errors.length} members.\n`;
		if (msg == "") msg += `✓ | There are no members with less than ${minimum} messages.`;
		message.reply(msg);
	}
};
