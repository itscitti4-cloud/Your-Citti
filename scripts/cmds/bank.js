const mongoose = require("mongoose");
const User = require("../../../database/model/mongodb/user.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const moment = require("moment-timezone");

const BANK_NAME = "Citti Bank";
const BANK_CODE = "CITTI";
const CURRENCY_SYMBOL = "$";
const INTEREST_RATE = 0.02;
const DAILY_WITHDRAW_LIMIT = 50000;
const DAILY_TRANSFER_LIMIT = 100000;
const MIN_DEPOSIT = 100;
const MIN_WITHDRAW = 100;
const MIN_TRANSFER = 50;
const CARD_ANNUAL_FEE = 500;
const CARD_VALIDITY_YEARS = 5;

const fontPath = path.join(__dirname, "assets", "font", "BeVietnamPro-Bold.ttf");
const fontPathRegular = path.join(__dirname, "assets", "font", "BeVietnamPro-Regular.ttf");

try {
    if (fs.existsSync(fontPath)) registerFont(fontPath, { family: "BankFont", weight: "bold" });
    if (fs.existsSync(fontPathRegular)) registerFont(fontPathRegular, { family: "BankFontRegular" });
} catch (e) {}

function generateAccountNumber() {
    return "CB" + Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
}

function generateCardNumber() {
    let card = "4";
    for (let i = 0; i < 15; i++) {
        card += Math.floor(Math.random() * 10);
    }
    return card;
}

function generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
}

function generatePIN() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function hashPIN(pin) {
    return crypto.createHash("sha256").update(pin + "cittibank_salt").digest("hex");
}

function formatCardNumber(cardNumber) {
    return cardNumber.replace(/(.{4})/g, "$1 ").trim();
}

function formatMoney(amount) {
    return amount.toLocaleString("en-US");
}

function getExpiryDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + CARD_VALIDITY_YEARS);
    return (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getFullYear().toString().slice(-2);
}

async function createBankCard(cardData, userData) {
    const width = 850;
    const height = 540;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#004e92");
    gradient.addColorStop(1, "#000428");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 30);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial";
    ctx.fillText(BANK_NAME, 50, 80);
    ctx.font = "bold 42px Courier New";
    ctx.fillText(formatCardNumber(cardData.cardNumber), 50, 300);
    ctx.font = "24px Arial";
    ctx.fillText(userData.name.toUpperCase(), 50, 470);
    ctx.fillText("VALID THRU: " + cardData.expiryDate, 550, 470);
    const buffer = canvas.toBuffer("image/png");
    const outputPath = path.join(__dirname, "tmp", `card_${Date.now()}.png`);
    await fs.ensureDir(path.join(__dirname, "tmp"));
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}

async function createTransactionReceipt(transaction, userData) {
    const width = 600;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#004e92";
    ctx.fillRect(0, 0, width, 120);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 35px Arial";
    ctx.textAlign = "center";
    ctx.fillText(BANK_NAME, width / 2, 70);
    ctx.textAlign = "left";
    ctx.fillStyle = "#333333";
    ctx.font = "18px Arial";
    ctx.fillText(`Transaction ID: ${transaction.transactionId}`, 40, 200);
    ctx.fillText(`Type: ${transaction.type.toUpperCase()}`, 40, 250);
    ctx.fillText(`Amount: ${CURRENCY_SYMBOL}${formatMoney(transaction.amount)}`, 40, 300);
    ctx.fillText(`Date: ${transaction.timestamp}`, 40, 350);
    const buffer = canvas.toBuffer("image/png");
    const outputPath = path.join(__dirname, "tmp", `receipt_${Date.now()}.png`);
    await fs.ensureDir(path.join(__dirname, "tmp"));
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}

function generateTransactionId() {
    return `TXN${Date.now().toString(36).toUpperCase()}`;
}

module.exports = {
    config: {
        name: "bank",
        aliases: ["atm"],
        version: "2.1",
        author: "AkHi",
        countDown: 5,
        role: 0,
        category: "game"
    },

    onStart: async function ({ api, event, args, message }) {
        const { senderID } = event;
        try {
            let userData = await User.findOne({ userID: senderID });
            const action = args[0]?.toLowerCase();

            switch (action) {
                case "register": {
                    if (userData?.data?.bank?.accountNumber) return message.reply("❌ আপনি ইতিমধ্যে নিবন্ধিত!");
                    if (!userData) userData = new User({ userID: senderID, data: {} });
                    if (!userData.data) userData.data = {};
                    
                    userData.data.bank = {
                        accountNumber: generateAccountNumber(),
                        balance: 0,
                        savings: 0,
                        totalDeposited: 0,
                        totalWithdrawn: 0,
                        totalTransferred: 0,
                        createdAt: moment().tz("Asia/Dhaka").format("DD/MM/YYYY"),
                        transactions: [],
                        cards: []
                    };
                    userData.markModified('data');
                    await userData.save();
                    return message.reply(`🏦 [ REGISTER SUCCESS ]\nAccount: ${userData.data.bank.accountNumber}\nBank: ${BANK_NAME}`);
                }

                case "balance":
                case "bal": {
                    if (!userData?.data?.bank?.accountNumber) return message.reply("⚠️ আগে ব্যাংক একাউন্ট খুলুন!");
                    return message.reply(`🏦 [ ${BANK_NAME} ]\n💰 Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}\n💎 Savings: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.savings || 0)}`);
                }

                case "deposit":
                case "dep": {
                    const amount = parseInt(args[1]);
                    if (!userData?.data?.bank?.accountNumber) return message.reply("⚠️ আগে একাউন্ট খুলুন!");
                    if (isNaN(amount) || amount < MIN_DEPOSIT) return message.reply(`❌ সর্বনিম্ন ডিপোজিট ${MIN_DEPOSIT}`);
                    if (userData.money < amount) return message.reply("❌ আপনার ওয়ালেটে পর্যাপ্ত টাকা নেই!");

                    const transaction = { transactionId: generateTransactionId(), type: "deposit", amount, timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm") };
                    userData.money -= amount;
                    userData.data.bank.balance += amount;
                    userData.data.bank.totalDeposited += amount;
                    userData.data.bank.transactions.unshift(transaction);
                    
                    userData.markModified('data');
                    await userData.save();
                    const pathR = await createTransactionReceipt(transaction, userData);
                    return message.reply({ body: "✅ ডিপোজিট সফল হয়েছে!", attachment: fs.createReadStream(pathR) }, () => fs.unlinkSync(pathR));
                }

                case "withdraw":
                case "wd": {
                    const amount = parseInt(args[1]);
                    if (!userData?.data?.bank?.accountNumber) return message.reply("⚠️ আগে একাউন্ট খুলুন!");
                    if (isNaN(amount) || amount < MIN_WITHDRAW) return message.reply(`❌ সর্বনিম্ন উত্তোলন ${MIN_WITHDRAW}`);
                    if (userData.data.bank.balance < amount) return message.reply("❌ ব্যাংকে পর্যাপ্ত ব্যালেন্স নেই!");

                    const transaction = { transactionId: generateTransactionId(), type: "withdraw", amount, timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm") };
                    userData.data.bank.balance -= amount;
                    userData.money += amount;
                    userData.data.bank.totalWithdrawn += amount;
                    userData.data.bank.transactions.unshift(transaction);

                    userData.markModified('data');
                    await userData.save();
                    const pathR = await createTransactionReceipt(transaction, userData);
                    return message.reply({ body: "✅ টাকা উত্তোলন সফল হয়েছে!", attachment: fs.createReadStream(pathR) }, () => fs.unlinkSync(pathR));
                }

                case "transfer":
                case "tf": {
                    let targetID = Object.keys(event.mentions).length > 0 ? Object.keys(event.mentions)[0] : args[1];
                    const amount = parseInt(args[2]);
                    if (!userData?.data?.bank?.accountNumber) return message.reply("⚠️ আগে একাউন্ট খুলুন!");
                    if (!targetID || isNaN(amount) || amount < MIN_TRANSFER) return message.reply("💡 ব্যবহার: bank transfer <@tag/UID> <amount>");

                    const targetUser = await User.findOne({ userID: targetID });
                    if (!targetUser?.data?.bank?.accountNumber) return message.reply("❌ প্রাপকের ব্যাংক একাউন্ট নেই!");
                    if (userData.data.bank.balance < amount) return message.reply("❌ পর্যাপ্ত ব্যালেন্স নেই!");

                    const transaction = { transactionId: generateTransactionId(), type: "transfer", amount, timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm") };
                    
                    userData.data.bank.balance -= amount;
                    userData.data.bank.totalTransferred += amount;
                    targetUser.data.bank.balance += amount;
                    
                    userData.data.bank.transactions.unshift(transaction);
                    targetUser.data.bank.transactions.unshift({ ...transaction, type: "received" });

                    userData.markModified('data');
                    targetUser.markModified('data');
                    await userData.save();
                    await targetUser.save();

                    const pathR = await createTransactionReceipt(transaction, userData);
                    return message.reply({ body: "✅ ট্রান্সফার সফল হয়েছে!", attachment: fs.createReadStream(pathR) }, () => fs.unlinkSync(pathR));
                }

                case "card": {
                    if (!userData?.data?.bank?.accountNumber) return message.reply("⚠️ আগে একাউন্ট খুলুন!");
                    if (args[1] === "apply") {
                        if (userData.data.bank.cards?.length > 0) return message.reply("❌ আপনার ইতিমধ্যে কার্ড আছে!");
                        const pin = generatePIN();
                        const cardInfo = { cardNumber: generateCardNumber(), cvv: generateCVV(), pin: hashPIN(pin), expiryDate: getExpiryDate(), isActive: true };
                        userData.data.bank.cards = [cardInfo];
                        userData.markModified('data');
                        await userData.save();
                        const pathC = await createBankCard(cardInfo, userData);
                        return message.reply({ body: `💳 কার্ড ইস্যু হয়েছে!\nPIN: ${pin} (গোপন রাখুন)`, attachment: fs.createReadStream(pathC) }, () => fs.unlinkSync(pathC));
                    }
                    if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) return message.reply("❌ কার্ড নেই! 'bank card apply' লিখুন।");
                    const pathC = await createBankCard(userData.data.bank.cards[0], userData);
                    return message.reply({ body: "💳 আপনার ডেবিট কার্ড", attachment: fs.createReadStream(pathC) }, () => fs.unlinkSync(pathC));
                }

                case "statement": {
                    if (!userData?.data?.bank?.accountNumber) return message.reply("⚠️ একাউন্ট নেই!");
                    const bank = userData.data.bank;
                    let msg = `📑 [ STATEMENT - ${BANK_NAME} ]\n👤 নাম: ${userData.name}\n📋 একাউন্ট: ${bank.accountNumber}\n💰 ব্যালেন্স: ${CURRENCY_SYMBOL}${formatMoney(bank.balance)}\n💎 সেভিংস: ${CURRENCY_SYMBOL}${formatMoney(bank.savings || 0)}\n\n📊 পরিসংখ্যান:\n📥 মোট জমা: ${formatMoney(bank.totalDeposited || 0)}\n📤 মোট উত্তোলন: ${formatMoney(bank.totalWithdrawn || 0)}\n🔄 মোট ট্রান্সফার: ${formatMoney(bank.totalTransferred || 0)}`;
                    return message.reply(msg);
                }

                default:
                    return message.reply("💡 কমান্ডসমূহ: register, balance, deposit, withdraw, transfer, card, statement");
            }
        } catch (error) {
            console.error(error);
            return message.reply("❌ ব্যাংক সার্ভারে সমস্যা হচ্ছে!");
        }
    }
};
