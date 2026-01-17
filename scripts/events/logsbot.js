const { getTime } = global.utils;

module.exports = {
	config: {
		name: "logsbot",
		isBot: true,
		version: "1.4",
		author: "AkHi",
		envConfig: {
			allow: true
		},
		category: "events"
	},

	langs: {
		en: {
			title: "====== Bot logs ======",
			added: "\n✅\nEvent:  bot has been added to a new group\n- Added by: %1",
			kicked: "\n❌\nEvent: bot has been kicked\n- Kicked by: %1",
			footer: "\n- User ID: %1\n- Group: %2\n- Group ID: %3\n- Time: %4"
		}
	},

	onStart: async ({ usersData, threadsData, event, api, getLang }) => {
		if (
			(event.logMessageType == "log:subscribe" && event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID()))
			|| (event.logMessageType == "log:unsubscribe" && event.logMessageData.leftParticipantFbId == api.getCurrentUserID())
		) {
			let msg = getLang("title");
			const { author, threadID } = event;
			
			if (author == api.getCurrentUserID())
				return;

			let threadName;

			if (event.logMessageType == "log:subscribe") {
				if (!event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID()))
					return;
				
				try {
					const threadInfo = await api.getThreadInfo(threadID);
					threadName = threadInfo.threadName || "Unknown Group";
				} catch (e) {
					threadName = "Unknown Group";
				}
				
				const authorName = await usersData.getName(author);
				msg += getLang("added", authorName);
			}
			else if (event.logMessageType == "log:unsubscribe") {
				if (event.logMessageData.leftParticipantFbId != api.getCurrentUserID())
					return;
				
				const authorName = await usersData.getName(author);
				const threadData = await threadsData.get(threadID);
				threadName = threadData ? threadData.threadName : "Unknown Group";
				msg += getLang("kicked", authorName);
			}

			const time = getTime("DD/MM/YYYY HH:mm:ss");
			msg += getLang("footer", author, threadName, threadID, time);

			// আপনার দেওয়া নির্দিষ্ট গ্রুপ আইডি
			const logGroupID = "1128938025925990";
			
			api.sendMessage(msg, logGroupID, (err) => {
				if (err) console.error("Logsbot Error: " + err);
			});
		}
	}
};
