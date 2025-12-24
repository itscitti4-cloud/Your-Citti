const axios = require("axios");

module.exports = {
    config: {
        name: "setavt",
        aliases: ["cngavt", "savt"],
        version: "1.3",
        author: "AkHi",
        countDown: 5,
        role: 2, // শুধুমাত্র ওনার বা অ্যাডমিনদের জন্য
        description: {
            vi: "Đổi avatar bot",
            en: "Change bot avatar"
        },
        category: "owner",
        guide: {
            en: "{pn} [image url | reply to image] [caption] [expiration (seconds)]"
        }
    },

    langs: {
        vi: {
            cannotGetImage: "❌ | Đã xảy ra lỗi khi truy vấn đến url hình ảnh",
            invalidImageFormat: "❌ | Định dạng hình ảnh không hợp lệ",
            changedAvatar: "✅ | Đã thay đổi avatar của bot thành công",
            noImage: "❌ | Vui lòng cung cấp URL ảnh hoặc reply một ảnh"
        },
        en: {
            cannotGetImage: "❌ | An error occurred while querying the image url",
            invalidImageFormat: "❌ | Invalid image format",
            changedAvatar: "✅ | Changed bot avatar successfully",
            noImage: "❌ | Please provide an image URL or reply to an image"
        }
    },

    onStart: async function ({ message, event, api, args, getLang }) {
        try {
            let imageURL;

            // ইমেজ ইউআরএল নির্ধারণ
            if (event.type == "message_reply" && event.messageReply.attachments.length > 0) {
                imageURL = event.messageReply.attachments[0].url;
            } else if (event.attachments.length > 0) {
                imageURL = event.attachments[0].url;
            } else if (args[0] && args[0].startsWith("http")) {
                imageURL = args.shift();
            }

            if (!imageURL) return message.reply(getLang("noImage"));

            // Expiration এবং Caption হ্যান্ডলিং
            let expirationAfter = null;
            if (args.length > 0 && !isNaN(args[args.length - 1])) {
                expirationAfter = parseInt(args.pop());
            }
            
            const caption = args.join(" ");

            // ইমেজটি স্ট্রিম হিসেবে ডাউনলোড করা
            let response;
            try {
                response = await axios.get(imageURL, {
                    responseType: "stream"
                });
            } catch (err) {
                return message.reply(getLang("cannotGetImage"));
            }

            if (!response.headers["content-type"].includes("image")) {
                return message.reply(getLang("invalidImageFormat"));
            }

            // আপডেটেড ফাইল পাথ অবজেক্ট
            response.data.path = "avatar.jpg"; 

            // এপিআই কল করে অবতার পরিবর্তন
            api.changeAvatar(
                response.data, 
                caption, 
                expirationAfter ? expirationAfter * 1000 : null, 
                (err) => {
                    if (err) return message.reply(`Error: ${err.message}`);
                    return message.reply(getLang("changedAvatar"));
                }
            );

        } catch (error) {
            console.error("SetAvt Error:", error);
            return message.reply("⚠️ | An unexpected error occurred.");
        }
    }
};
