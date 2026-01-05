const { getStreamsFromAttachment } = global.utils;
const moment = require("moment-timezone");
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

module.exports = {
	config: {
		name: "callad",
		version: "2.3",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: "send report to admin",
		category: "contacts admin",
		guide: "{pn} <message>"
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName }) {
		const { config } = global.GoatBot;
		const { senderID, threadID, isGroup, messageID } = event;

		if (!args[0]) return message.reply("❌ Please enter the message you want to send to admin");

		// এডমিন আইডিগুলো নিশ্চিত করা
		const adminBot = config.adminBot || [];
		if (adminBot.length == 0) return message.reply("🚫 Bot has no admin at the moment");

		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const senderName = await usersData.getName(senderID);
		
		let groupName = "Private Message";
		if (isGroup) {
			const threadInfo = await threadsData.get(threadID);
			groupName = threadInfo.threadName || "Unnamed Group";
		}

		const body = "»—☀️— **𝙲𝙰𝙻𝙻 𝙰𝙳𝙼𝙸𝙽** —☀️—«\n\n"
			+ ` ➤ 𝐓𝐢𝐦𝐞: ${time}\n`
			+ ` ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n`
			+ ` ➤ 𝐔𝐈𝐃: ${senderID}\n`
			+ ` ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupName}\n\n`
			+ `»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n`
			+ `»─────────────────«\n💬 Reply to this message to chat`;

		let count = 0;
		let adminList = [];

		for (const adminID of adminBot) {
			try {
				const id = String(adminID).trim();
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
					adminList.push(`<@${id}> (${name})`);
				}
			} catch (err) {
				console.error(`Failed to send callad to ${adminID}:`, err);
			}
		}

		if (count > 0) {
			return message.reply({
				body: `✅ Sent your message to ${count} admin(s) successfully!\n${adminList.join("\n")}`,
				mentions: adminBot.map(id => ({ id: String(id), tag: "" }))
			});
		} else {
			return message.reply("❌ Failed to reach any admin. Please check your admin UID in config.");
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
				if (err) return message.reply("❌ Cannot send reply.");
				message.reply("✅ Response sent to User!");
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
				const threadInfo = await threadsData.get(event.threadID);
				groupInfo = threadInfo.threadName || "Unnamed Group";
			}

			const body = `»—👤— **𝐔𝐒𝐄𝐑 𝐑𝐄𝐏𝐋𝐘** —👤—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n ➤ 𝐔𝐈𝐃: ${event.senderID}\n ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupInfo}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n💬 Reply to chat`;
			
			api.sendMessage({
				body,
				mentions: [{ id: event.senderID, tag: senderName }],
				attachment: attachments.length > 0 ? await getStreamsFromAttachment(attachments) : []
			}, threadID, (err, info) => {
				if (err) return message.reply("❌ Cannot send reply.");
				message.reply("✅ Response sent to Admin!");
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
				
