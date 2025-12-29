const axios = require('axios');
const fs = require('fs');
const path = require('path');

const supportedDomains = [
  { domain: 'facebook.com', cookieFile: null },
  { domain: 'instagram.com', cookieFile: 'insta.txt' },
  { domain: 'youtube.com', cookieFile: 'yt.txt' },
  { domain: 'youtu.be', cookieFile: 'yt.txt' },
  { domain: 'pinterest.com', cookieFile: null },
  { domain: "tiktok.com", cookieFile: null },
];

function getMainDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === 'youtu.be') {
      return 'youtube.com';
    }
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  } catch (e) {
    return null;
  }
}

function getDefaultCookie(domain) {
  const domainEntry = supportedDomains.find(entry => entry.domain === domain);
  return domainEntry ? domainEntry.cookieFile : null;
}

function parseArgs(args) {
  const params = {};
  args.forEach((arg, i) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2).toLowerCase();
      const value = args[i + 1];
      switch (key) {
        case 'maxsize':
        case 'ms':
        case 'fs':
          if (!isNaN(Number(value))) params.filesize = Number(value);
          break;
        case 'type':
        case 'format':
        case 'media':
        case 'f':
          if (['video', 'audio'].includes(value.toLowerCase())) {
            params.format = value.toLowerCase();
          }
          break;
        case 'cookie':
        case 'cookies':
        case 'c':
          const cookiePath = path.join(process.cwd(), value);
          if (fs.existsSync(cookiePath)) {
            params.cookies = fs.readFileSync(cookiePath, 'utf-8');
          }
          break;
        default:
          break;
      }
    }
  });
  return params;
}

async function download({ url, params, message, event, usersData }) {
  try {
    const domain = getMainDomain(url);
    const platformName = domain ? domain.split('.')[0].toUpperCase() : "Media";
    const userData = await usersData.get(event.senderID);
    const userName = userData.name || "User";

    if (!params.cookies) {
      const defaultCookieFile = getDefaultCookie(domain);
      if (defaultCookieFile) {
        const cookiePath = path.join(process.cwd(), defaultCookieFile);
        if (fs.existsSync(cookiePath)) {
          params.cookies = fs.readFileSync(cookiePath, 'utf-8');
        }
      }
    }
    
    if (!params.filesize) {
      params.filesize = 25;
    }
    
    const requestBody = {
      url,
      ...(params.format && { format: params.format }),
      ...(params.filesize && { filesize: params.filesize }),
      ...(params.cookies && { cookies: params.cookies }),
    };
    
    const apiUrl = (await axios.get('https://raw.githubusercontent.com/Tanvir0999/stuffs/refs/heads/main/raw/addresses.json')).data.megadl;
    const response = await axios.post(apiUrl, requestBody);
    const data = response.data;
    
    await message.reply({
      body: `𝙷𝚎𝚢 ${userName} 𝚑𝚎𝚛𝚎 𝚒𝚜 𝚢𝚘𝚞𝚛 ${platformName} 𝚟𝚒𝚍𝚎𝚘. 𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙻𝚄𝙱𝙽𝙰 𝙹𝙰𝙽𝙽𝙰𝚃 𝙰𝙺𝙷𝙸.`,
      attachment: await global.utils.getStreamFromUrl(data.url),
    });
    
    message.reaction('✅', event.messageID);
  } catch (error) {
    message.reaction('❌', event.messageID);
    console.error(error);
  }
}

module.exports = {
  config: {
    name: 'download',
    aliases: ['downloader', 'megadl', 'fb', 'fbdl', 'facebook', 'insta', 'instadl', 'instagram', 'yt', 'ytdl'],
    version: '2.5',
    author: 'AkHi',
    countDown: 5,
    role: 0,
    longDescription: 'Download videos or audios from supported platforms.',
    category: 'media',
    guide: {
      en: {
        body: `{pn} [URL]`,
      },
    },
  },
  
  onStart: async function({ message, args, event, threadsData, usersData, role }) {
    if (args[0] === 'on' || args[0] === 'off') {
      if (role < 1) return message.reply('You do not have permission.');
      const choice = args[0] === 'on';
      const gcData = await threadsData.get(event.threadID, "data");
      await threadsData.set(event.threadID, { data: { ...gcData, autoDownload: choice } });
      return message.reply(`Auto-download has been turned ${choice ? 'on' : 'off'} for this group.`);
    }
    
    const url = args.find(arg => /^https?:\/\//.test(arg));
    if (!url) return message.reply('Please provide a valid URL.');
    
    const domain = getMainDomain(url);
    if (!supportedDomains.some(entry => entry.domain === domain)) {
      return message.reply('This platform is not supported.');
    }
    
    const params = parseArgs(args.filter(arg => arg !== url));
    message.reaction('⏳', event.messageID);
    await download({ url, params, message, event, usersData });
  },
  
  onChat: async function({ event, message, threadsData, usersData }) {
    if (event.senderID === global.botID) return;
    const threadData = await threadsData.get(event.threadID);
    
    // Default ON করার জন্য এই লাইনটি আপডেট করা হয়েছে
    if (threadData.data && threadData.data.autoDownload === false) return;
    
    try {
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const match = event.body.match(urlRegex);
      if (match) {
        const url = match[0];
        const domain = getMainDomain(url);
        if (supportedDomains.some(entry => entry.domain === domain)) {
          // কাস্টম মেসেজ বা প্রিফিক্স থাকলে ডাউনলোড এড়িয়ে চলবে
          const prefix = await global.utils.getPrefix(event.threadID);
          if (event.body.startsWith(prefix)) return;

          message.reaction('⏳', event.messageID);
          await download({ url, params: {}, message, event, usersData });
        }
      }
    } catch (error) {
      console.error('onChat Error:', error);
    }
  },
};
                          
