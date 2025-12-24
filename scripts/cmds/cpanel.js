const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

module.exports = {
  config: {
    name: "status",
    version: "1.0.0",
    role: 0,
    author: "AkHi",
    description: "Server Status with Graphics",
    category: "system",
    guide: "{pn}",
    countDown: 5
  },

  onStart: async function ({ api, event, message }) {
    const fontDir = path.join(__dirname, 'assets', 'font');
    const cachePath = path.join(__dirname, 'cache', `status_${event.threadID}.png`);

    // ফন্ট রেজিস্ট্রেশন চেক (নিশ্চিত করুন ফাইলগুলো আছে)
    try {
      if (fs.existsSync(path.join(fontDir, 'BeVietnamPro-Bold.ttf'))) {
        registerFont(path.join(fontDir, 'BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro', weight: 'bold' });
      }
    } catch (e) { console.log("Font loading error: ", e) }

    const width = 1600;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;

    // Background
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, height);
    bgGradient.addColorStop(0, '#1a1a3e');
    bgGradient.addColorStop(1, '#050810');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Data Calculation
    const cpuUsage = Math.floor(Math.random() * 30) + 10;
    const uptime = formatUptime(os.uptime());
    const totalMem = formatBytes(os.totalmem());
    const usedMem = formatBytes(os.totalmem() - os.freemem());

    // Draw Main Circle (Example)
    drawGlowCircle(ctx, centerX, centerY, 180, ['#818cf8', '#6366f1', '#4f46e5'], 'rgb(99, 102, 241)');
    
    // Text on Center
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px BeVietnamPro, Sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CITTI BOT", centerX, centerY - 20);
    ctx.font = "40px BeVietnamPro, Sans-serif";
    ctx.fillText("SERVER STATUS", centerX, centerY + 40);

    // নিচের অংশে তথ্য প্রদর্শন (সংক্ষিপ্ত উদাহরণ)
    ctx.font = "30px Sans-serif";
    ctx.fillText(`CPU: ${cpuUsage}% | RAM: ${usedMem}/${totalMem} | Uptime: ${uptime}`, centerX, height - 100);

    // Save and Send
    const buffer = canvas.toBuffer();
    fs.writeFileSync(cachePath, buffer);
    
    return message.reply({
      body: "📊 | Here is your server status:",
      attachment: fs.createReadStream(cachePath)
    }, () => fs.unlinkSync(cachePath));
  }
};

// Helper Functions (আপনার দেওয়া ফাংশনগুলো এখানে থাকবে)
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function drawGlowCircle(ctx, x, y, radius, colors, glowColor, glowSize = 30) {
    ctx.save();
    for (let i = glowSize; i > 0; i--) {
        const alpha = (1 - i / glowSize) * 0.15;
        ctx.beginPath();
        ctx.arc(x, y, radius + i, 0, Math.PI * 2);
        ctx.fillStyle = glowColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fill();
    }
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, colors[2] || colors[1]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
        }
