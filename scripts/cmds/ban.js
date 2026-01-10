const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "ban",
		version: "1.5",
		author: "AkHi",
		countDown: 5,
		role: 1,
		description: "Ban user from box chat",
		category: "box chat",
		guide: 
			      "   {pn} [@tag|uid|fb link|reply] [<reason>]: Ban user from box chat"
				+ "\n   {pn} check: Check and kick banned members"
				+ "\n   {pn} unban [@tag|uid|fb link|reply]: Unban user"
				+ "\n   {pn} list: View banned members list"
	},

	{
			notFoundTarget: "⚠ | Please tag the person to ban or enter uid or fb link or reply to the message of the person to ban",
			notFoundTargetUnban: "⚠ | Please tag the person to unban or enter uid or fb link or reply to the message of the person to unban",
			userNotBanned: "⚠ | The person with id %1 is not banned from this box chat",
			unbannedSuccess: "✓ | Unbanned %1 from box chat!",
			cantSelfBan: "⚠ | You can't ban yourself!",
			cantBanAdmin: "✗ | You can't ban the administrator!",
			existedBan: "✗ | This person has been banned before!",
			noReason: "No reason",
			bannedSuccess: "✓ | Banned %1 from box chat!",
			needAdmin: "⚠ | Bot needs administrator permission to kick banned members",
			noName: "Facebook user",
			noData: "≡ | There are no banned members in this box chat",
			listBanned: "≡ | List of banned members in this box chat (page %1/%2)",
			content: "%1/ %2 (%3)\nReason: %4\nBan time: %5\n\n",
			needAdminToKick: "⚠ | Member %1 (%2) has been banned, but I lack admin powers to kick them.",
			bannedKick: "⚠ | %1 was previously banned!\nUID: %2\nReason: %3\nBan time: %4\n\nAuto-kicked successfully."
		
	},

	onStart: async function ({ message, event, args, threadsData, getLang, usersData, api }) {
		const { members, adminIDs } = await threadsData.get(event.threadID);
		const { senderID, threadID, messageID } = event;
		let target;
		let reason;

		const dataBanned = await threadsData.get(threadID, 'data.banned_ban', []);

		if (args[0] == 'unban') {
			if (!isNaN(args[1])) target = args[1];
			else if (args[1]?.startsWith('https')) target = await findUid(args[1]);
			else if (Object.keys(event.mentions || {}).length) target = Object.keys(event.mentions)[0];
			else if (event.messageReply?.senderID) target = event.messageReply.senderID;
			else return message.reply(getLang('notFoundTargetUnban'));

			const index = dataBanned.findIndex(item => item.id == target);
			if (index == -1) return message.reply(getLang('userNotBanned', target));

			dataBanned.splice(index, 1);
			await threadsData.set(threadID, dataBanned, 'data.banned_ban');
			const userName = members[target]?.name || await usersData.getName(target) || getLang('noName');
			return message.reply(getLang('unbannedSuccess', userName));
		}
		
		if (args[0] == "check") {
			if (!dataBanned.length) return message.reply(getLang('noData'));
			let kickCount = 0;
			for (const user of dataBanned) {
				if (event.participantIDs.includes(user.id)) {
					await api.removeUserFromGroup(user.id, threadID);
					kickCount++;
				}
			}
			return message.reply(`✅ Checked and kicked ${kickCount} banned members.`);
		}

		if (args[0] == 'list') {
			if (!dataBanned.length) return message.reply(getLang('noData'));
			const limit = 20;
			const page = parseInt(args[1] || 1) || 1;
			const start = (page - 1) * limit;
			const data = dataBanned.slice(start, start + limit);
			let msg = '';
			for (let i = 0; i < data.length; i++) {
				const name = await usersData.getName(data[i].id) || getLang('noName');
				msg += getLang('content', start + i + 1, name, data[i].id, data[i].reason, data[i].time);
			}
			return message.reply(getLang('listBanned', page, Math.ceil(dataBanned.length / limit)) + '\n\n' + msg);
		}

		// Handle Target for Banning
		if (event.messageReply?.senderID) {
			target = event.messageReply.senderID;
			reason = args.join(' ');
		} else if (Object.keys(event.mentions || {}).length) {
			target = Object.keys(event.mentions)[0];
			reason = args.join(' ').replace(event.mentions[target], '').trim();
		} else if (!isNaN(args[0])) {
			target = args[0];
			reason = args.slice(1).join(' ');
		} else if (args[0]?.startsWith('https')) {
			target = await findUid(args[0]);
			reason = args.slice(1).join(' ');
		}

		if (!target) return message.reply(getLang('notFoundTarget'));
		if (target == senderID) return message.reply(getLang('cantSelfBan'));
		if (adminIDs.includes(target)) return message.reply(getLang('cantBanAdmin'));
		if (dataBanned.some(item => item.id == target)) return message.reply(getLang('existedBan'));

		const name = await usersData.getName(target) || getLang('noName');
		const time = moment().tz(global.GoatBot.config.timeZone).format('HH:mm:ss DD/MM/YYYY');
		
		const newBan = { id: target, time, reason: reason || getLang('noReason') };
		dataBanned.push(newBan);
		
		await threadsData.set(threadID, dataBanned, 'data.banned_ban');
		
		message.reply(getLang('bannedSuccess', name), () => {
			if (event.participantIDs.includes(target)) {
				api.removeUserFromGroup(target, threadID, (err) => {
					if (err && !adminIDs.includes(api.getCurrentUserID())) {
						message.send(getLang('needAdmin'));
					}
				});
			}
		});
	},

	onEvent: async function ({ event, api, threadsData, getLang }) {
		// লজিক: যখন কেউ গ্রুপে জয়েন করে
		if (event.logMessageType === "log:subscribe") {
			const { threadID, logMessageData } = event;
			const dataBanned = await threadsData.get(threadID, 'data.banned_ban', []);
			if (dataBanned.length === 0) return;

			const addedUsers = logMessageData.addedParticipants;
			for (const user of addedUsers) {
				const bannedUser = dataBanned.find(item => item.id == user.userFbId);
				if (bannedUser) {
					api.removeUserFromGroup(user.userFbId, threadID, (err) => {
						if (err) {
							api.sendMessage(getLang('needAdminToKick', user.fullName, user.userFbId), threadID);
						} else {
							api.sendMessage(getLang('bannedKick', user.fullName, user.userFbId, bannedUser.reason, bannedUser.time), threadID);
						}
					});
				}
			}
		}
	}
};
				
