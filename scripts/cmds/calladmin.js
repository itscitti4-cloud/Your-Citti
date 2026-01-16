const { getStreamsFromAttachment } = global.utils;
const moment = require("moment-timezone");
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

// Admin List for Direct Messages
const ADMIN_LIST = [
	{ name: "Ew'r Zara", id: "100052951819398" },
	{ name: "Afruja AkHi", id: "61586354826910" },
	{ name: "NAWAB", id: "61586632438983"}
];

module.exports = {
	config: {
		name: "calladmin",
		aliases: ["callad", "calldev"],
		version: "3.5",
		author: "AkHi / Gemini",
		countDown: 5,
		role: 0,
		description: "Send report directly to admins' inbox",
		category: "contacts admin",
		guide: "{pn} <message>"
	},

	onStart: async function ({ args, message, event, usersData, api, commandName }) {
		const { senderID, threadID, isGroup, messageID } = event;

		if (!args[0]) return message.reply("❌ Please enter a message for the admins.");

		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const senderName = await usersData.getName(senderID);
		
		let groupName = "Private Message";
		if (isGroup) {
			try {
				const threadInfo = await global.threadsData.get(threadID);
				groupName = threadInfo.threadName || "Unnamed Group";
			} catch (e) { groupName = "Group Chat"; }
		}

		const body = "»—☀️— **𝙲𝙰𝙻𝙻 𝙰𝙳𝙼𝙸𝙽** —☀️—«\n\n"
			+ ` ➤ 𝐓𝐢𝐦𝐞: ${time}\n`
			+ ` ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n`
			+ ` ➤ 𝐔𝐈𝐃: ${senderID}\n`
			+ ` ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupName}\n\n`
			+ `»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n`
			+ `»─────────────────«\n💬 Reply to chat`;

		let sentCount = 0;
		let failedAdmins = [];

		for (const admin of ADMIN_LIST) {
			try {
				const info = await new Promise((resolve, reject) => {
					api.sendMessage({ body, mentions: [{ id: senderID, tag: senderName }] }, admin.id, (err, msgInfo) => {
						if (err) return reject(err);
						resolve(msgInfo);
					});
				});

				if (info) {
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						threadID,
						messageIDSender: messageID,
						type: "userCallAdmin"
					});
					sentCount++;
				}
			} catch (e) {
				console.error(`Failed to send message to admin ${admin.id}:`, e);
				failedAdmins.push(admin.name);
			}
		}

		if (sentCount > 0) {
			let response = `✅ Sent to ${sentCount} admins successfully.\n`
				+ `»────────────────────«\n`
				+ ADMIN_LIST.map(ad => `● ${ad.name}`).join("\n")
				+ `\n»────────────────────«\n`
				+ `*Please wait for a response!`;
			
			if (failedAdmins.length > 0) {
				response += `\n⚠️ Failed to reach: ${failedAdmins.join(", ")}`;
			}
			return message.reply(response);
		} else {
			return message.reply("❌ Could not send message to any admin. They may need to message the bot first.");
		}
	},

	onReply: async ({ args, event, api, message, Reply, usersData, threadsData, commandName }) => {
		const { type, threadID, messageIDSender } = Reply;
		const senderName = await usersData.getName(event.senderID);
		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const attachments = event.attachments.filter(item => mediaTypes.includes(item.type));

		const isUserToAdmin = type === "userCallAdmin";
		
		let body = "";
		if (isUserToAdmin) {
			body = `»—📩— **𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐒𝐏𝐎𝐍𝐒𝐄** —📩—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐀𝐝𝐦𝐢𝐧: ${senderName}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n✍️ Reply to continue`;
		} else {
			let groupName = "Private Message";
			try {
				const threadInfo = await threadsData.get(event.threadID);
				groupName = threadInfo.threadName || "Unnamed Group";
			} catch (e) { groupName = "Group Chat"; }

			body = `»—👤— **𝐔𝐒𝐄𝐑 𝐑𝐄𝐏𝐋𝐘** —👤—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupName}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n💬 Reply to chat`;
		}

		api.sendMessage({
			body,
			mentions: [{ id: event.senderID, tag: senderName }],
			attachment: attachments.length > 0 ? await getStreamsFromAttachment(attachments) : []
		}, threadID, (err, info) => {
			if (err) return message.reply("❌ Failed to send reply. The user/admin might have blocked the bot.");
			
			message.reply(isUserToAdmin ? `✅ Response sent to user!` : `✅ Your reply has been sent to admins!`);
			
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				messageIDSender: event.messageID,
				threadID: event.threadID,
				type: isUserToAdmin ? "adminReply" : "userCallAdmin"
			});
		}, messageIDSender);
	}
};
																																		   
