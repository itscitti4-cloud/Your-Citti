const { getStreamsFromAttachment } = global.utils;
const moment = require("moment-timezone");
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

// Fixed Admin IDs
const ADMIN_IDS = ["61585634146171", "61583939430347"];

module.exports = {
	config: {
		name: "calladmin",
		aliases: ["callad", "calldev"],
		version: "2.6",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: "send report directly to specified admins",
		category: "contacts admin",
		guide: "{pn} <message>"
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName }) {
		const { senderID, threadID, isGroup, messageID } = event;

		if (!args[0]) return message.reply("❌ Please enter the message you want to send to admin");

		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const senderName = await usersData.getName(senderID);
		
		let groupName = "Private Message";
		if (isGroup) {
			try {
				const threadInfo = await threadsData.get(threadID);
				groupName = threadInfo.threadName || "Unnamed Group";
			} catch (e) { groupName = "Group Chat"; }
		}

		const body = "»—☀️— **𝙲𝙰𝙻𝙻 𝙰𝙳𝙼𝙸𝙽** —☀️—«\n\n"
			+ ` ➤ 𝐓𝐢𝐦𝐞: ${time}\n`
			+ ` ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n`
			+ ` ➤ 𝐔𝐈𝐃: ${senderID}\n`
			+ ` ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupName}\n\n`
			+ `»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n`
			+ `»─────────────────«\n💬 Reply to this message to chat`;

		let count = 0;
		let successAdminList = [];

		for (const id of ADMIN_IDS) {
			try {
				const info = await api.sendMessage({ body, mentions: [{ id: senderID, tag: senderName }] }, id);
				
				if (info) {
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						threadID,
						messageIDSender: messageID,
						type: "userCallAdmin"
					});
					count++;
					const name = await usersData.getName(id);
					successAdminList.push(`${name} (${id})`);
				}
			} catch (err) {
				console.error(`🔴 Error sending to admin ${id}:`, err);
			}
		}

		if (count > 0) {
			return message.reply(`✅ Your message has been sent successfully to ${count} admin(s).\n\nAdmins:\n${successAdminList.join("\n")}`);
		} else {
			return message.reply("❌ Failed to send message to admins. They might not be in the bot's friend list or their message requests are disabled.");
		}
	},

	onReply: async ({ args, event, api, message, Reply, usersData, threadsData, commandName }) => {
		const { type, threadID, messageIDSender } = Reply;
		const senderName = await usersData.getName(event.senderID);
		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const attachments = event.attachments.filter(item => mediaTypes.includes(item.type));

		if (type === "userCallAdmin") {
			const body = `»—📩— **𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐒𝐏𝐎𝐍𝐒𝐄** —📩—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐀𝐝𝐦𝐢𝐧: ${senderName}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n✍️ Reply to continue`;
			
			api.sendMessage({
				body,
				mentions: [{ id: event.senderID, tag: senderName }],
				attachment: attachments.length > 0 ? await getStreamsFromAttachment(attachments) : []
			}, threadID, (err, info) => {
				if (err) return message.reply("❌ Failed to send the reply.");
				message.reply("✅ Response sent to User successfully!");
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					messageIDSender: event.messageID,
					threadID: event.threadID,
					type: "adminReply"
				});
			}, messageIDSender);

		} else if (type === "adminReply") {
			let groupInfo = "Private Message";
			if (event.isGroup) {
				try {
					const threadInfo = await threadsData.get(event.threadID);
					groupInfo = threadInfo.threadName || "Unnamed Group";
				} catch (e) { groupInfo = "Group Chat"; }
			}

			const body = `»—👤— **𝐔𝐒𝐄𝐑 𝐑𝐄𝐏𝐋𝐘** —👤—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n ➤ 𝐔𝐈𝐃: ${event.senderID}\n ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupInfo}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n💬 Reply to chat`;
			
			api.sendMessage({
				body,
				mentions: [{ id: event.senderID, tag: senderName }],
				attachment: attachments.length > 0 ? await getStreamsFromAttachment(attachments) : []
			}, threadID, (err, info) => {
				if (err) return message.reply("❌ Failed to send the reply to Admin.");
				message.reply("✅ Your response has been sent to Admin!");
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					messageIDSender: event.messageID,
					threadID: event.threadID,
					type: "userCallAdmin"
				});
			}, messageIDSender);
		}
	}
};
