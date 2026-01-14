const { getStreamsFromAttachment } = global.utils;
const moment = require("moment-timezone");
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

// Admin Group ID
const ADMIN_GROUP_ID = "1128938025925990";

// Admin List for Displaying in Confirmation
const ADMIN_LIST = [
	{ name: "Ew'r Zara", id: "100052951819398" },
	{ name: "Afruja AkHi", id: "61586354826910" },
	{ name: "NAWAB", id: "61586632438983"}
];

module.exports = {
	config: {
		name: "calladmin",
		aliases: ["callad", "calldev"],
		version: "3.4",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: "Send report to admin group with custom confirmation",
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

		try {
			const info = await new Promise((resolve, reject) => {
				api.sendMessage({ body, mentions: [{ id: senderID, tag: senderName }] }, ADMIN_GROUP_ID, (err, msgInfo) => {
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

				let adminInfo = ADMIN_LIST.map(ad => `${ad.name} : ${ad.id}`).join("\n");
				let response = `✅ Your Call Admin Message sent to ${ADMIN_LIST.length} admins Successfully:\n`
					+ `»────────────────────«\n`
					+ `${adminInfo}\n`
					+ `»────────────────────«\n`
					+ `*please wait for admin response!`;

				return message.reply(response);
			}
		} catch (e) {
			console.error(e);
			return message.reply("❌ Error: Could not send message to Admin Group. Make sure the bot is a member of that group.");
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
			// অ্যাডমিন যখন রিপ্লাই দিচ্ছে তখন ইউজারের জন্য ফরম্যাট
			body = `»—📩— **𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐒𝐏𝐎𝐍𝐒𝐄** —📩—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐀𝐝𝐦𝐢𝐧: ${senderName}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n✍️ Reply to continue`;
		} else {
			// ইউজার যখন রিপ্লাই দিচ্ছে তখন অ্যাডমিন গ্রুপের জন্য ফরম্যাট
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
			if (err) return message.reply("❌ Failed to send reply.");
			message.reply(isUserToAdmin ? `✅ Response sent successfully!` : `✅ Your reply has been sent to admins!`);
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
