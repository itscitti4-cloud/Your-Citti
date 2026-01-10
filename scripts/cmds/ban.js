const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "ban",
		version: "1.6",
		author: "AkHi",
		countDown: 5,
		role: 1,
		description: "Ban user from box chat",
		category: "box chat",
		guide:    "   {pn} [@tag|uid|fb link|reply] [<reason>]: Ban user from box chat"
				+ "\n   {pn} check: Check and kick banned members"
				+ "\n   {pn} unban [@tag|uid|fb link|reply]: Unban user"
				+ "\n   {pn} list: View banned members list"
	},

	onStart: async function ({ message, event, args, threadsData, usersData, api }) {
		const { members, adminIDs } = await threadsData.get(event.threadID);
		const { senderID, threadID } = event;
		let target;
		let reason;

		const dataBanned = await threadsData.get(threadID, 'data.banned_ban', []);

		// --- UNBAN LOGIC ---
		if (args[0] == 'unban') {
			if (!isNaN(args[1])) target = args[1];
			else if (args[1]?.startsWith('https')) target = await findUid(args[1]);
			else if (Object.keys(event.mentions || {}).length) target = Object.keys(event.mentions)[0];
			else if (event.messageReply?.senderID) target = event.messageReply.senderID;
			else return message.reply("⚠ | Please tag, enter UID/link, or reply to unban someone.");

			const index = dataBanned.findIndex(item => item.id == target);
			if (index == -1) return message.reply(`⚠ | User with ID ${target} is not banned.`);

			dataBanned.splice(index, 1);
			await threadsData.set(threadID, dataBanned, 'data.banned_ban');
			const userName = await usersData.getName(target) || "Facebook User";
			return message.reply(`✓ | Unbanned ${userName} from box chat!`);
		}
		
		// --- CHECK LOGIC ---
		if (args[0] == "check") {
			if (!dataBanned.length) return message.reply("≡ | No banned members in this chat.");
			let kickCount = 0;
			for (const user of dataBanned) {
				if (event.participantIDs.includes(user.id)) {
					await api.removeUserFromGroup(user.id, threadID);
					kickCount++;
				}
			}
			return message.reply(`✅ Checked and kicked ${kickCount} banned members.`);
		}

		// --- LIST LOGIC ---
		if (args[0] == 'list') {
			if (!dataBanned.length) return message.reply("≡ | No banned members in this chat.");
			const limit = 20;
			const page = parseInt(args[1] || 1) || 1;
			const start = (page - 1) * limit;
			const data = dataBanned.slice(start, start + limit);
			let msg = '';
			for (let i = 0; i < data.length; i++) {
				const name = await usersData.getName(data[i].id) || "Facebook User";
				msg += `${start + i + 1}/ ${name} (${data[i].id})\nReason: ${data[i].reason}\nTime: ${data[i].time}\n\n`;
			}
			return message.reply(`≡ | Banned list (Page ${page}/${Math.ceil(dataBanned.length / limit)})\n\n${msg}`);
		}

		// --- BAN TARGETING ---
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

		if (!target) return message.reply("⚠ | Please tag, reply, or provide a link to ban.");
		if (target == senderID) return message.reply("⚠ | You can't ban yourself!");
		if (adminIDs.includes(target)) return message.reply("✗ | You can't ban an administrator!");
		if (dataBanned.some(item => item.id == target)) return message.reply("✗ | This person is already banned!");

		const name = await usersData.getName(target) || "Facebook User";
		const time = moment().tz("Asia/Dhaka").format('HH:mm:ss DD/MM/YYYY');
		
		const newBan = { id: target, time, reason: reason || "No reason" };
		dataBanned.push(newBan);
		
		await threadsData.set(threadID, dataBanned, 'data.banned_ban');
		
		message.reply(`✓ | Banned ${name} from box chat!`, () => {
			if (event.participantIDs.includes(target)) {
				api.removeUserFromGroup(target, threadID, (err) => {
					if (err) message.send("⚠ | Bot needs admin power to kick the user.");
				});
			}
		});
	},

	onEvent: async function ({ event, api, threadsData }) {
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
							api.sendMessage(`⚠ | Banned member ${user.fullName} joined, but I can't kick them without admin powers.`, threadID);
						} else {
							api.sendMessage(`⚠ | ${user.fullName} was previously banned!\nReason: ${bannedUser.reason}\nBot has auto-kicked.`, threadID);
						}
					});
				}
			}
		}
	}
};
