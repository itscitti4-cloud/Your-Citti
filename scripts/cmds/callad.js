const { getStreamsFromAttachment, log } = global.utils;
const moment = require("moment-timezone");
const mediaTypes = ["photo", 'png', "animated_image", "video", "audio"];

module.exports = {
	config: {
		name: "callad",
		version: "1.9",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: {
			vi: "gửi báo cáo, góp ý, báo lỗi,... của bạn về admin bot",
			en: "send report, feedback, bug,... to admin bot"
		},
		category: "contacts admin",
		guide: {
			vi: "   {pn} <tin nhắn>",
			en: "   {pn} <message>"
		}
	},

	langs: {
		en: {
			missingMessage: "❌ Please enter the message you want to send to admin",
			sendByGroup: "\n ➤ 𝐆𝐫𝐨𝐮𝐩: %1",
			sendByUser: "\n ➤ 𝐆𝐫𝐨𝐮𝐩: Private Message",
			content: "\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n%1\n\n»─────────────────«\n💬 Reply to this message to chat",
			success: "✅ Sent your message to %1 admin(s) successfully!\n%2",
			failed: "⚠️ Failed to send message to %1 admin(s)\n%2\nCheck console for details",
			reply: "»—📩— **𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐒𝐏𝐎𝐍𝐒𝐄** —📩—«\n\n ➤ 𝐓𝐢𝐦𝐞: %1\n ➤ 𝐀𝐝𝐦𝐢𝐧: %2\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n%3\n\n»─────────────────«\n✍️ Reply to continue",
			replySuccess: "✅ Response sent to Admin!",
			feedback: "»—👤— **𝐔𝐒𝐄𝐑 𝐑𝐄𝐏𝐋𝐘** —👤—«\n\n ➤ 𝐓𝐢𝐦𝐞: %1\n ➤ 𝐔𝐬𝐞𝐫: %2\n ➤ 𝐔𝐈𝐃: %3%4\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n%5\n\n»─────────────────«\n💬 Reply to chat",
			replyUserSuccess: "✅ Response sent to User successfully!",
			noAdmin: "🚫 Bot has no admin at the moment"
		}
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
		const { config } = global.GoatBot;
		if (!args[0]) return message.reply(getLang("missingMessage"));
		const { senderID, threadID, isGroup } = event;
		if (config.adminBot.length == 0) return message.reply(getLang("noAdmin"));

		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const senderName = await usersData.getName(senderID);
		
		const msg = "»—☀️— **𝙲𝙰𝙻𝙻 𝙰𝙳𝙼𝙸𝙽** —☀️—«\n\n"
			+ ` ➤ 𝐓𝐢𝐦𝐞: ${time}\n`
			+ ` ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n`
			+ ` ➤ 𝐔𝐈𝐃: ${senderID}`
			+ (isGroup ? getLang("sendByGroup", (await threadsData.get(threadID)).threadName) : getLang("sendByUser"));

		const formMessage = {
			body: msg + getLang("content", args.join(" ")),
			mentions: [{ id: senderID, tag: senderName }]
		};

		const successIDs = [];
		const adminNames = await Promise.all(config.adminBot.map(async item => ({
			id: item,
			name: await usersData.getName(item)
		})));

		for (const uid of config.adminBot) {
			try {
				const messageSend = await api.sendMessage(formMessage, uid);
				successIDs.push(uid);
				global.GoatBot.onReply.set(messageSend.messageID, {
					commandName,
					messageID: messageSend.messageID,
					threadID,
					messageIDSender: event.messageID,
					type: "userCallAdmin"
				});
			} catch (err) { log.err("CALL ADMIN", err); }
		}

		if (successIDs.length > 0) {
			let msgSuccess = getLang("success", successIDs.length, adminNames.filter(item => successIDs.includes(item.id)).map(item => ` <@${item.id}> (${item.name})`).join("\n"));
			return message.reply({ body: msgSuccess, mentions: adminNames.map(item => ({ id: item.id, tag: item.name })) });
		}
	},

	onReply: async ({ args, event, api, message, Reply, usersData, threadsData, commandName, getLang }) => {
		const { type, threadID, messageIDSender } = Reply;
		const senderName = await usersData.getName(event.senderID);
		const time = moment.tz("Asia/Dhaka").format("hh:mm A");

		switch (type) {
			case "userCallAdmin": {
				const formMessage = {
					body: getLang("reply", time, senderName, args.join(" ")),
					mentions: [{ id: event.senderID, tag: senderName }],
					attachment: await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type)))
				};

				api.sendMessage(formMessage, threadID, (err, info) => {
					if (err) return message.err(err);
					message.reply(getLang("replyUserSuccess"));
					global.GoatBot.onReply.set(info.messageID, { commandName, messageID: info.messageID, messageIDSender: event.messageID, threadID: event.threadID, type: "adminReply" });
				}, messageIDSender);
				break;
			}
			case "adminReply": {
				let groupInfo = event.isGroup ? getLang("sendByGroup", (await threadsData.get(event.threadID)).threadName) : getLang("sendByUser");
				const formMessage = {
					body: getLang("feedback", time, senderName, event.senderID, groupInfo, args.join(" ")),
					mentions: [{ id: event.senderID, tag: senderName }],
					attachment: await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type)))
				};

				api.sendMessage(formMessage, threadID, (err, info) => {
					if (err) return message.err(err);
					message.reply(getLang("replySuccess"));
					global.GoatBot.onReply.set(info.messageID, { commandName, messageID: info.messageID, messageIDSender: event.messageID, threadID: event.threadID, type: "userCallAdmin" });
				}, messageIDSender);
				break;
			}
		}
	}
};
