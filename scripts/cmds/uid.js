const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
    config: {
        name: "uid",
        version: "1.6",
        author: "AkHi",
        countDown: 5,
        role: 0,
        description: "View facebook user id of user",
        category: "information",
        guide: {
            en: "{pn} [mention/link/reply/blank]"
        }
    },

    onStart: async function ({ message, event, args }) {
        const { senderID, messageReply, mentions } = event;

        // ১. রিপ্লাই করলে ওই ইউজারের আইডি দেখাবে
        if (messageReply) {
            return message.reply(messageReply.senderID);
        }

        // ২. মেনশন (Tag) করলে আইডি দেখাবে
        // লজিক: আগে মেনশন চেক করা হচ্ছে যাতে args থাকলেও এটি কাজ করে
        const mentionKeys = Object.keys(mentions);
        if (mentionKeys.length > 0) {
            let msgMentions = "";
            for (const id of mentionKeys) {
                // মেনশন করা নাম এবং আইডি আলাদা করে দেখানো
                msgMentions += `${mentions[id].replace("@", "")}: ${id}\n`;
            }
            return message.reply(msgMentions.trim());
        }

        // ৩. প্রোফাইল লিংক দিলে আইডি বের করা
        if (args[0] && regExCheckURL.test(args[0])) {
            let msg = "";
            for (const link of args) {
                try {
                    const uid = await findUid(link);
                    if (uid) {
                        msg += `🆔 UID: ${uid}\n🔗 Link: ${link}\n\n`;
                    } else {
                        msg += `❌ Could not find UID for this link: ${link}\n\n`;
                    }
                } catch (e) {
                    msg += `❌ Error: ${link} => ${e.message}\n\n`;
                }
            }
            return message.reply(msg.trim());
        }

        // ৪. যদি কোনো আর্গুমেন্ট না থাকে তবে নিজের আইডি দেখাবে
        if (args.length === 0) {
            return message.reply(senderID);
        }

        // ৫. যদি এমন কিছু লেখে যা উপরের কিছুর সাথে মেলে না (যেমন শুধু টেক্সট)
        return message.reply("Please tag someone, reply to a message, or provide a link to view the UID.");
    }
};
