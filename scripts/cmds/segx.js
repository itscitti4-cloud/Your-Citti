const axios = require("axios");
const fs = require("fs-extra");
const cheerio = require("cheerio");
const path = require("path");

// এই ফাংশনটি ভিডিওর সরাসরি সোর্স লিঙ্ক বের করার জন্য ব্যবহৃত হবে
async function getDirectVideoUrl(videoName) {
  try {
    const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(videoName)}&sort=relevance`;
    const { data: searchData } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(searchData);
    let videoPageUrl = null;

    // প্রথম ভিডিওর লিঙ্কটি নেওয়া হচ্ছে
    $('.thumb-block').each((i, el) => {
      if (videoPageUrl) return;
      const link = $(el).find('a').attr('href');
      if (link && link.includes('/video')) {
        videoPageUrl = 'https://www.xvideos.com' + link;
      }
    });

    if (!videoPageUrl) return null;

    const { data: videoPage } = await axios.get(videoPageUrl, { timeout: 10000 });
    
    // ভিডিওর সোর্স ইউআরএল খুঁজে বের করা (High বা Low Quality)
    const highMatch = videoPage.match(/setVideoUrlHigh\('([^']+)'\)/);
    const lowMatch = videoPage.match(/setVideoUrlLow\('([^']+)'\)/);

    if (highMatch) return { url: highMatch[1], quality: 'high' };
    if (lowMatch) return { url: lowMatch[1], quality: 'low' };

    return null;
  } catch (err) {
    console.error("Scraper Error:", err.message);
    return null;
  }
}

async function getStreamAndSize(url) {
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.xvideos.com/'
    }
  });
  return {
    stream: response.data,
    size: response.headers["content-length"]
  };
}

module.exports = {
  config: {
    name: "segx",
    aliases: ["sg", "porn"],
    version: "2.1.0",
    author: "AkHi / Gemini",
    countDown: 5,
    role: 2,
    description: { en: "Search and download videos without API Key" },
    category: "media",
    guide: { en: "{pn} <query>" }
  },

  onStart: async function ({ args, message, event, commandName }) {
    const query = args.join(" ");
    if (!query) return message.reply("⚠️ Please provide a search query.");

    try {
      // Xvideos থেকে সার্চ রেজাল্ট স্ক্র্যাপ করা হচ্ছে
      const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(query)}`;
      const { data } = await axios.get(searchUrl);
      const $ = cheerio.load(data);
      const results = [];

      $('.thumb-block').each((i, el) => {
        if (i < 10) {
          const title = $(el).find('.title a').text().trim();
          const duration = $(el).find('.duration').text().trim();
          const videoUrl = 'https://www.xvideos.com' + $(el).find('.title a').attr('href');
          if (title) results.push({ title, duration, videoUrl });
        }
      });

      if (results.length === 0) return message.reply("❌ No results found.");

      let msg = "🔍 Search Results:\n\n";
      results.forEach((v, i) => {
        msg += `${i + 1}. ${v.title}\n   • Duration: ${v.duration}\n\n`;
      });

      msg += "👉 Reply with number to download.";

      message.reply(msg, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          results
        });
      });

    } catch (err) {
      return message.reply("❌ Search failed. Please try again later.");
    }
  },

  onReply: async ({ event, api, Reply, message }) => {
    const { results, author } = Reply;
    if (event.senderID !== author) return;

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > results.length) return;

    const selectedVideo = results[choice - 1];
    api.unsendMessage(Reply.messageID);

    const msgSend = await message.reply(`⏳ Processing "${selectedVideo.title}"...`);

    try {
      const directData = await getDirectVideoUrl(selectedVideo.title);

      if (!directData || !directData.url) {
        message.unsend(msgSend.messageID);
        return message.reply("❌ Could not fetch download link.");
      }

      const { stream, size } = await getStreamAndSize(directData.url);
      const MAX_SIZE = 83 * 1024 * 1024; // 83MB Limit

      if (size && parseInt(size) > MAX_SIZE) {
        message.unsend(msgSend.messageID);
        return message.reply("⚠️ Video is too large to send (>83MB).");
      }

      const tmpPath = path.join(__dirname, `tmp_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tmpPath);
      stream.pipe(writer);

      writer.on("finish", async () => {
        try {
          await message.reply({
            body: `✅ Video: ${selectedVideo.title}\n📊 Quality: ${directData.quality}`,
            attachment: fs.createReadStream(tmpPath)
          });
          message.unsend(msgSend.messageID);
        } finally {
          fs.unlinkSync(tmpPath);
        }
      });

    } catch (err) {
      message.unsend(msgSend.messageID);
      return message.reply("❌ Error occurred during download.");
    }
  }
};
            
