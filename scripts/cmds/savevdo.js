const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "autodl",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "AkHi",
    description: "লিঙ্ক থেকে ভিডিও অটো ডাউনলোড করে",
    commandCategory: "Media",
    usages: "[video link]",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body } = event;

    // ভিডিও লিঙ্ক চেক করার ফিল্টার (TikTok, FB, Reels, YT, Insta ইত্যাদি)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = body?.match(urlRegex);

    if (!links) return;

    const videoLink = links[0];
    
    // সাপোর্ট করা ওয়েবসাইট চেক (আপনি চাইলে আরও বাড়াতে পারেন)
    if (videoLink.includes("tiktok.com") || videoLink.includes("facebook.com") || videoLink.includes("fb.watch") || videoLink.includes("instagram.com") || videoLink.includes("reels")) {
      
      try {
        // ১. শুরুতে ⌛ রিঅ্যাক্ট দেওয়া
        await api.setMessageReaction("⌛", messageID, () => {}, true);

        // ২. ডাউনলোডার এপিআই কল (এক্ষেত্রে একটি পাবলিক এপিআই ব্যবহার করা হয়েছে)
        // দ্রষ্টব্য: এপিআই কাজ না করলে অন্য কোনো ওয়ার্কিং এপিআই ইউআরএল এখানে দিন
        const res = await axios.get(`https://api.samir.ltd/download/alldl?url=${encodeURIComponent(videoLink)}`);
        const videoUrl = res.data.result.url || res.data.result;

        const videoPath = path.join(__dirname, 'cache', `${Date.now()}.mp4`);
        const getStream = (await axios.get(videoUrl, { responseType: 'arraybuffer' })).data;
        fs.writeFileSync(videoPath, Buffer.from(getStream, 'utf-8'));

        // ৩. ভিডিও সেন্ড করা
        await api.sendMessage({
          body: "Success! Here is your video ✅",
          attachment: fs.createReadStream(videoPath)
        }, threadID, async (err) => {
          if (!err) {
            // ৪. সফল হলে ✅ রিঅ্যাক্ট দেওয়া
            await api.setMessageReaction("✅", messageID, () => {}, true);
          }
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        });

      } catch (error) {
        console.error(error);
        // ৫. ব্যর্থ হলে ❌ রিঅ্যাক্ট দেওয়া
        await api.setMessageReaction("❌", messageID, () => {}, true);
      }
    }
  },

  run: async function ({ api, event }) {
    // এটি শুধু হেল্প মেসেজ দেখানোর জন্য
    api.sendMessage("যেকোনো ভিডিও লিঙ্ক দিন, আমি সেটি অটো ডাউনলোড করে দেব।", event.threadID);
  }
};
                                                           
