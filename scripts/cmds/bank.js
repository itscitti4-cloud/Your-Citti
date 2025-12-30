const mongoose = require("mongoose");
const User = require("../../../database/model/mongodb/user.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const moment = require("moment-timezone");

const BANK_NAME = "GOAT BANK";
const BANK_CODE = "GOAT";
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
    return "GB" + Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
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
    return crypto.createHash("sha256").update(pin + "goatbank_salt").digest("hex");
}

function formatCardNumber(cardNumber) {
    return cardNumber.replace(/(.{4})/g, "$1 ").trim();
}

function formatMoney(amount) {
    return amount.toLocaleString("en-US");
}

function getExpiryDate(yearsFromNow = CARD_VALIDITY_YEARS) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + yearsFromNow);
    return (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getFullYear().toString().slice(-2);
}

async function createBankCard(cardData, userData) {
    const width = 850;
    const height = 540;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (cardData.cardType === "platinum") {
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(0.3, "#16213e");
        gradient.addColorStop(0.6, "#0f3460");
        gradient.addColorStop(1, "#1a1a2e");
    } else if (cardData.cardType === "gold") {
        gradient.addColorStop(0, "#b8860b");
        gradient.addColorStop(0.3, "#daa520");
        gradient.addColorStop(0.6, "#ffd700");
        gradient.addColorStop(1, "#b8860b");
    } else {
        gradient.addColorStop(0, "#2c3e50");
        gradient.addColorStop(0.3, "#34495e");
        gradient.addColorStop(0.6, "#5d6d7e");
        gradient.addColorStop(1, "#2c3e50");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 30);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(10, 10, width - 20, height - 20, 25);
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + i * 0.01})`;
        ctx.lineWidth = 1;
        ctx.arc(width * 0.7 + i * 20, height * 0.3 - i * 10, 150 + i * 30, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.roundRect(50, 150, 90, 70, 8);
    ctx.fill();

    ctx.strokeStyle = "#a67c00";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(50, 158 + i * 13);
        ctx.lineTo(140, 158 + i * 13);
        ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(65 + i * 25, 150);
        ctx.lineTo(65 + i * 25, 220);
        ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillText(BANK_NAME, 50, 80);

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = cardData.cardType === "gold" ? "#1a1a1a" : "#ffffff";
    const typeText = cardData.cardType.toUpperCase();
    ctx.fillText(typeText, width - ctx.measureText(typeText).width - 50, 80);

    ctx.font = "bold 42px Arial, monospace";
    ctx.fillStyle = "#ffffff";
    ctx.letterSpacing = "4px";
    const formattedCard = formatCardNumber(cardData.cardNumber);
    ctx.fillText(formattedCard, 50, 300);

    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("VALID THRU", 50, 360);
    ctx.fillText("CVV", 200, 360);

    ctx.font = "bold 22px Arial, monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(cardData.expiryDate, 50, 390);
    ctx.fillText("***", 200, 390);

    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    const holderName = userData.name.toUpperCase().slice(0, 25);
    ctx.fillText(holderName, 50, 470);

    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("DEBIT", width - 100, 470);

    ctx.fillStyle = "#ff5f00";
    ctx.beginPath();
    ctx.arc(width - 130, 180, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eb001b";
    ctx.beginPath();
    ctx.arc(width - 90, 180, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255, 95, 0, 0.5)";
    ctx.beginPath();
    ctx.arc(width - 110, 180, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.font = "12px Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(`ACC: ${cardData.accountNumber}`, 50, height - 30);

    const buffer = canvas.toBuffer("image/png");
    const outputPath = path.join(__dirname, "tmp", `card_${cardData.cardNumber.slice(-4)}_${Date.now()}.png`);
    await fs.ensureDir(path.join(__dirname, "tmp"));
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}

async function createTransactionReceipt(transaction, senderData, receiverData = null) {
    const width = 600;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const headerGradient = ctx.createLinearGradient(0, 0, width, 120);
    headerGradient.addColorStop(0, "#1a1a2e");
    headerGradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, 120);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(BANK_NAME, width / 2, 55);
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("TRANSACTION RECEIPT", width / 2, 90);

    ctx.textAlign = "left";
    ctx.fillStyle = "#333333";
    let y = 160;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("TRANSACTION ID", 40, y);
    ctx.font = "16px Arial, monospace";
    ctx.fillStyle = "#1a1a2e";
    ctx.fillText(transaction.transactionId, 40, y + 22);
    y += 60;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("DATE & TIME", 40, y);
    ctx.font = "16px Arial, sans-serif";
    ctx.fillStyle = "#333333";
    ctx.fillText(transaction.timestamp, 40, y + 22);
    y += 60;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("TRANSACTION TYPE", 40, y);
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillStyle = transaction.type === "deposit" ? "#27ae60" : 
                    transaction.type === "withdraw" ? "#e74c3c" : 
                    "#3498db";
    ctx.fillText(transaction.type.toUpperCase(), 40, y + 24);
    y += 70;

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    y += 30;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("FROM ACCOUNT", 40, y);
    ctx.font = "16px Arial, sans-serif";
    ctx.fillStyle = "#333333";
    ctx.fillText(senderData.name, 40, y + 22);
    ctx.font = "14px Arial, monospace";
    ctx.fillStyle = "#666666";
    ctx.fillText(transaction.fromAccount || "N/A", 40, y + 42);
    y += 80;

    if (receiverData) {
        ctx.font = "bold 14px Arial, sans-serif";
        ctx.fillStyle = "#666666";
        ctx.fillText("TO ACCOUNT", 40, y);
        ctx.font = "16px Arial, sans-serif";
        ctx.fillStyle = "#333333";
        ctx.fillText(receiverData.name, 40, y + 22);
        ctx.font = "14px Arial, monospace";
        ctx.fillStyle = "#666666";
        ctx.fillText(transaction.toAccount || "N/A", 40, y + 42);
        y += 80;
    }

    ctx.strokeStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    y += 40;

    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("AMOUNT", 40, y);
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.fillStyle = transaction.type === "deposit" ? "#27ae60" : 
                    transaction.type === "withdraw" ? "#e74c3c" : 
                    "#1a1a2e";
    const prefix = transaction.type === "deposit" ? "+" : "-";
    ctx.fillText(`${prefix}${CURRENCY_SYMBOL}${formatMoney(transaction.amount)}`, 40, y + 45);
    y += 90;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("NEW BALANCE", 40, y);
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillStyle = "#1a1a2e";
    ctx.fillText(`${CURRENCY_SYMBOL}${formatMoney(transaction.newBalance)}`, 40, y + 30);
    y += 80;

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, height - 100, width, 100);
    ctx.font = "12px Arial, sans-serif";
    ctx.fillStyle = "#999999";
    ctx.textAlign = "center";
    ctx.fillText("This is an official transaction receipt from " + BANK_NAME, width / 2, height - 60);
    ctx.fillText("Keep this receipt for your records", width / 2, height - 40);
    ctx.fillText("Customer Service: Available 24/7", width / 2, height - 20);

    const buffer = canvas.toBuffer("image/png");
    const outputPath = path.join(__dirname, "tmp", `receipt_${transaction.transactionId}.png`);
    await fs.ensureDir(path.join(__dirname, "tmp"));
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}

function generateTransactionId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
}

function ensureDataStructure(userData) {
    if (!userData.data) userData.data = {};
    if (!userData.data.bank) {
        userData.data.bank = null;
    }
    if (userData.data.bank && userData.data.bank.accountNumber && !userData.data.bank.isRegistered) {
        userData.data.bank.isRegistered = true;
    }
    return userData;
}

function isRegistered(userData) {
    if (!userData.data || !userData.data.bank) return false;
    if (userData.data.bank.isRegistered === true) return true;
    if (userData.data.bank.accountNumber && userData.data.bank.transactions && userData.data.bank.transactions.length > 0) {
        return true;
    }
    return false;
}

function createBankAccount(userData) {
    if (userData.data.bank && userData.data.bank.accountNumber) {
        return userData;
    }
    userData.data.bank = {
        isRegistered: true,
        accountNumber: generateAccountNumber(),
        balance: 0,
        savings: 0,
        transactions: [],
        cards: [],
        dailyWithdraw: { date: null, amount: 0 },
        dailyTransfer: { date: null, amount: 0 },
        createdAt: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
        lastInterest: null,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalTransferred: 0
    };
    return userData;
}

module.exports = {
    config: {
        name: "bank",
        aliases: ["atm", "banking"],
        version: "2.0",
        author: "AkHi",
        countDown: 5,
        role: 0,
        description: "Complete banking system with ATM cards, transfers, savings accounts",
        category: "game",
        guide: `{pn} - View bank menu
{pn} register - Register account
{pn} balance - Check balance  
{pn} deposit <amount> - Deposit money
{pn} withdraw <amount> - Withdraw money
{pn} transfer <@tag or UID> <amount> - Transfer money
{pn} history - Transaction history
{pn} card - View ATM card
{pn} card apply <standard/gold/platinum> - Apply for card
{pn} card activate - Activate card
{pn} card block - Block card
{pn} card pin <new PIN> - Change PIN
{pn} savings deposit <amount> - Deposit to savings
{pn} savings withdraw - Withdraw savings
{pn} statement - Account statement`
    },

    langs: {
        en: {
            menu: `
     🏦 ${BANK_NAME}     
══════════════════════
 📋 BANKING SERVICES:      
                          
 💰 deposit - Deposit     
 💸 withdraw - Withdraw   
 🔄 transfer - Transfer   
 📊 balance - Balance     
 📜 history - History     
 💳 card - ATM Card       
 🏧 savings - Savings     
 📑 statement - Statement`,
            notRegistered: "❌ You don't have a bank account!\nUse: bank register to sign up",
            alreadyRegistered: "✅ You already have a bank account!",
            registered: `🎉 REGISTRATION SUCCESSFUL!

🏦 ${BANK_NAME}
━━━━━━━━━━━━━━━━━
📋 Account No: %1
💰 Balance: ${CURRENCY_SYMBOL}0
📅 Opened: %2
━━━━━━━━━━━━━━━━━
Welcome to ${BANK_NAME}!`,
            balance: `💳 ACCOUNT INFORMATION

🏦 ${BANK_NAME}
━━━━━━━━━━━━━━━━━
👤 Holder: %1
📋 Account: %2
💰 Balance: ${CURRENCY_SYMBOL}%3
💎 Savings: ${CURRENCY_SYMBOL}%4
━━━━━━━━━━━━━━━━━
📊 Total Deposits: ${CURRENCY_SYMBOL}%5
📊 Total Withdrawals: ${CURRENCY_SYMBOL}%6`,
            depositSuccess: "✅ Deposit successful!",
            withdrawSuccess: "✅ Withdrawal successful!",
            transferSuccess: "✅ Transfer successful!",
            invalidAmount: "❌ Invalid amount!",
            insufficientBalance: "❌ Insufficient bank balance!",
            insufficientWallet: "❌ Insufficient wallet balance!",
            minDeposit: `❌ Minimum deposit is ${CURRENCY_SYMBOL}${MIN_DEPOSIT}`,
            minWithdraw: `❌ Minimum withdrawal is ${CURRENCY_SYMBOL}${MIN_WITHDRAW}`,
            minTransfer: `❌ Minimum transfer is ${CURRENCY_SYMBOL}${MIN_TRANSFER}`,
            dailyLimitReached: "❌ You've reached today's transaction limit!",
            noTransactions: "📭 No transactions yet!",
            noCard: "❌ You don't have an ATM card!\nUse: bank card apply <type>",
            cardApplied: "✅ Card application successful! Your PIN: %1",
            cardActivated: "✅ Card has been activated!",
            cardBlocked: "✅ Card has been blocked!",
            pinChanged: "✅ PIN changed successfully!",
            invalidPin: "❌ PIN must be 4 digits!",
            savingsDeposited: "✅ Savings deposit successful!",
            savingsWithdrawn: "✅ Savings withdrawal successful!",
            noSavings: "❌ You have no savings!"
        }
    },

    onStart: async function ({ api, event, args, message, getLang }) {
        const { senderID, threadID, messageID } = event;

        try {
            // ১. MongoDB থেকে ইউজার ডাটা কল করা
            let userData = await User.findOne({ userID: senderID });

            // ২. অ্যাকশন নির্ধারণ (যেমন: register, bal)
            const action = args[0]?.toLowerCase();

            // ৩. switch case শুরু
            switch (action) {
                case "register": {
                    // যদি ইউজার আগে থেকেই থাকে এবং তার ব্যাংকিং ডাটা থাকে
                    if (userData && userData.data && userData.data.bank && userData.data.bank.accountNumber) {
                        return message.reply("❌ You are already registered in our banking system!");
                    }

                    // নতুন অ্যাকাউন্ট ডিটেইলস জেনারেট করা
                    const accountNumber = generateAccountNumber();
                    const cardNumber = generateCardNumber();
                    const createdAt = moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss");

                    const transaction = {
                        transactionId: generateTransactionId(),
                        type: "account_opened",
                        amount: 0,
                        newBalance: 0,
                        timestamp: createdAt,
                        description: "Account opened"
                    };

                    // নতুন ইউজার তৈরি বা আপডেট করা
                    if (!userData) {
                        userData = new User({ userID: senderID, data: {} });
                    }

                    userData.data.bank = {
                        accountNumber: accountNumber,
                        cardNumber: cardNumber,
                        balance: 0,
                        savings: 0,
                        totalDeposited: 0,
                        totalWithdrawn: 0,
                        createdAt: createdAt,
                        transactions: [transaction]
                    };

                    userData.markModified('data'); // Object আপডেট করার জন্য জরুরি
                    await userData.save(); // MongoDB তে সেভ

                    return message.reply(`🏦 [ REGISTER SUCCESS ]\n━━━━━━━━━━━━━━━━━━\nAccount No: ${accountNumber}\nCreated At: ${createdAt}\n\nWelcome to ${BANK_NAME}!`);
                }

                case "balance":
                case "bal": {
                    if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                        return message.reply("⚠️ You don't have a bank account. Use 'bank register' to create one.");
                    }

                    const bank = userData.data.bank;
                    return message.reply(
                        `🏦 [ BANK STATEMENT ]\n━━━━━━━━━━━━━━━━━━\n` +
                        `👤 Name: ${userData.name || "User"}\n` +
                        `💳 Acc No: ${bank.accountNumber}\n` +
                        `💰 Balance: ${formatMoney(bank.balance)}\n` +
                        `🏦 Savings: ${formatMoney(bank.savings || 0)}\n` +
                        `📥 Total Dep: ${formatMoney(bank.totalDeposited || 0)}\n` +
                        `📤 Total With: ${formatMoney(bank.totalWithdrawn || 0)}`
                    );
                }

                        case "deposit":
            case "dep": {
                // ১. রেজিস্ট্রেশন চেক
                if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                    return message.reply("⚠️ You don't have a bank account. Use 'bank register' to create one.");
                }

                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) {
                    return message.reply("❌ Please provide a valid amount to deposit.");
                }
                if (amount < MIN_DEPOSIT) {
                    return message.reply(`❌ Minimum deposit amount is ${CURRENCY_SYMBOL}${formatMoney(MIN_DEPOSIT)}.`);
                }
                
                // আপনার স্কিমা অনুযায়ী userData.money চেক (হাতের ক্যাশ)
                if (userData.money < amount) {
                    return message.reply("❌ You don't have enough cash in your wallet!");
                }

                const transaction = {
                    transactionId: generateTransactionId(),
                    type: "deposit",
                    amount: amount,
                    fromAccount: "Wallet",
                    newBalance: userData.data.bank.balance + amount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: "Wallet to Bank deposit"
                };

                // ২. ডাটা আপডেট
                userData.money -= amount; // হাতের টাকা কমানো
                userData.data.bank.balance += amount; // ব্যাংকের টাকা বাড়ানো
                userData.data.bank.totalDeposited = (userData.data.bank.totalDeposited || 0) + amount;
                
                // ট্রানজেকশন লিস্ট আপডেট
                if (!userData.data.bank.transactions) userData.data.bank.transactions = [];
                userData.data.bank.transactions.unshift(transaction);
                if (userData.data.bank.transactions.length > 50) {
                    userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                }

                // ৩. MongoDB তে সেভ
                userData.markModified('data');
                await userData.save();

                const receiptPath = await createTransactionReceipt(transaction, userData);
                return message.reply({
                    body: `✅ [ DEPOSIT SUCCESS ]\n\n💰 Amount: ${CURRENCY_SYMBOL}${formatMoney(amount)}\n💳 New Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}\n🔖 Transaction ID: ${transaction.transactionId}`,
                    attachment: fs.createReadStream(receiptPath)
                }, () => fs.unlinkSync(receiptPath));
            }

            case "withdraw":
            case "wd": {
                if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                    return message.reply("⚠️ You don't have a bank account to withdraw money.");
                }

                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) {
                    return message.reply("❌ Please provide a valid amount to withdraw.");
                }
                if (amount < MIN_WITHDRAW) {
                    return message.reply(`❌ Minimum withdrawal amount is ${CURRENCY_SYMBOL}${formatMoney(MIN_WITHDRAW)}.`);
                }
                if (userData.data.bank.balance < amount) {
                    return message.reply("❌ Insufficient bank balance!");
                }

                // ৪. ডেইলি লিমিট চেক
                const today = moment().tz("Asia/Dhaka").format("DD/MM/YYYY");
                if (!userData.data.bank.dailyWithdraw) {
                    userData.data.bank.dailyWithdraw = { date: today, amount: 0 };
                }

                if (userData.data.bank.dailyWithdraw.date === today) {
                    if (userData.data.bank.dailyWithdraw.amount + amount > DAILY_WITHDRAW_LIMIT) {
                        return message.reply(`❌ Daily limit reached!\nRemaining today: ${CURRENCY_SYMBOL}${formatMoney(DAILY_WITHDRAW_LIMIT - userData.data.bank.dailyWithdraw.amount)}`);
                    }
                    userData.data.bank.dailyWithdraw.amount += amount;
                } else {
                    userData.data.bank.dailyWithdraw = { date: today, amount: amount };
                }

                const transaction = {
                    transactionId: generateTransactionId(),
                    type: "withdraw",
                    amount: amount,
                    newBalance: userData.data.bank.balance - amount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: "Bank to Wallet withdrawal"
                };

                // ৫. ডাটা আপডেট ও সেভ
                userData.data.bank.balance -= amount;
                userData.money += amount;
                userData.data.bank.totalWithdrawn = (userData.data.bank.totalWithdrawn || 0) + amount;
                
                userData.data.bank.transactions.unshift(transaction);
                
                userData.markModified('data');
                await userData.save();

                const receiptPath = await createTransactionReceipt(transaction, userData);
                return message.reply({
                    body: `✅ [ WITHDRAW SUCCESS ]\n\n💰 Amount: ${CURRENCY_SYMBOL}${formatMoney(amount)}\n💳 New Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}\n🔖 Transaction ID: ${transaction.transactionId}`,
                    attachment: fs.createReadStream(receiptPath)
                }, () => fs.unlinkSync(receiptPath));
            }

                                const transaction = {
                    transactionId: generateTransactionId(),
                    type: "withdraw",
                    amount: amount,
                    fromAccount: userData.data.bank.accountNumber,
                    newBalance: userData.data.bank.balance - amount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: "Bank to Wallet withdrawal"
                };

                // ১. ডাটা আপডেট
                userData.data.bank.balance -= amount;
                userData.money += amount; // হাতের ক্যাশ বাড়ানো
                userData.data.bank.totalWithdrawn = (userData.data.bank.totalWithdrawn || 0) + amount;
                
                if (!userData.data.bank.transactions) userData.data.bank.transactions = [];
                userData.data.bank.transactions.unshift(transaction);
                if (userData.data.bank.transactions.length > 50) {
                    userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                }

                // ২. MongoDB তে সেভ
                userData.markModified('data');
                await userData.save();

                const receiptPath = await createTransactionReceipt(transaction, userData);
                return message.reply({
                    body: `✅ [ WITHDRAW SUCCESS ]\n\n💸 Amount: ${CURRENCY_SYMBOL}${formatMoney(amount)}\n💳 Bank Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}\n👛 Wallet Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.money)}\n🔖 Transaction ID: ${transaction.transactionId}`,
                    attachment: fs.createReadStream(receiptPath), () => fs.unlinkSync(receiptPath));

            case "transfer":
            case "tf": {
                if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                    return message.reply("⚠️ You don't have a bank account. Register first!");
                }

                let targetID;
                let transferAmount;

                // মেনশন বা ইউআইডি হ্যান্ডেল করা
                if (Object.keys(event.mentions).length > 0) {
                    targetID = Object.keys(event.mentions)[0];
                    transferAmount = parseInt(args[2]) || parseInt(args[1]);
                } else {
                    targetID = args[1];
                    transferAmount = parseInt(args[2]);
                }

                if (!targetID || isNaN(transferAmount) || transferAmount <= 0) {
                    return message.reply("💡 Usage: bank transfer <@user or UID> <amount>");
                }
                if (transferAmount < MIN_TRANSFER) {
                    return message.reply(`❌ Minimum transfer amount is ${CURRENCY_SYMBOL}${formatMoney(MIN_TRANSFER)}.`);
                }
                if (userData.data.bank.balance < transferAmount) {
                    return message.reply("❌ Your bank balance is insufficient for this transfer.");
                }
                if (targetID == senderID) {
                    return message.reply("❌ You cannot transfer money to yourself!");
                }

                // ৩. যাকে টাকা পাঠাবেন তাকে MongoDB তে খোঁজা
                const targetUser = await User.findOne({ userID: targetID });

                if (!targetUser || !targetUser.data || !targetUser.data.bank || !targetUser.data.bank.accountNumber) {
                    return message.reply("❌ The recipient does not have a bank account or is not registered.");
                }

                // ৪. ট্রানজেকশন তৈরি (প্রেরক এবং গ্রাহক উভয়ের জন্য)
                const senderTransaction = {
                    transactionId: generateTransactionId(),
                    type: "transfer_sent",
                    amount: transferAmount,
                    toAccount: targetUser.data.bank.accountNumber,
                    newBalance: userData.data.bank.balance - transferAmount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: `Transferred to ${targetUser.name || targetID}`
                };

                const receiverTransaction = {
                    transactionId: generateTransactionId(),
                    type: "transfer_received",
                    amount: transferAmount,
                    fromAccount: userData.data.bank.accountNumber,
                    newBalance: targetUser.data.bank.balance + transferAmount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: `Received from ${userData.name || senderID}`
                };

                // ৫. প্রেরকের ব্যালেন্স আপডেট ও সেভ
                userData.data.bank.balance -= transferAmount;
                userData.data.bank.transactions.unshift(senderTransaction);
                userData.markModified('data');
                await userData.save();

                // ৬. গ্রাহকের ব্যালেন্স আপডেট ও সেভ
                targetUser.data.bank.balance += transferAmount;
                if (!targetUser.data.bank.transactions) targetUser.data.bank.transactions = [];
                targetUser.data.bank.transactions.unshift(receiverTransaction);
                targetUser.markModified('data');
                await targetUser.save();

                return message.reply(`✅ [ TRANSFER SUCCESS ]\n\n👤 Sent to: ${targetUser.name || targetID}\n💰 Amount: ${CURRENCY_SYMBOL}${formatMoney(transferAmount)}\n🔖 Transaction ID: ${senderTransaction.transactionId}`);
            }

                                // ১. ডেইলি ট্রান্সফার লিমিট চেক করা
                const today = moment().tz("Asia/Dhaka").format("DD/MM/YYYY");
                if (!userData.data.bank.dailyTransfer) {
                    userData.data.bank.dailyTransfer = { date: today, amount: 0 };
                }

                if (userData.data.bank.dailyTransfer.date === today) {
                    if (userData.data.bank.dailyTransfer.amount + transferAmount > DAILY_TRANSFER_LIMIT) {
                        return message.reply(`❌ Daily transfer limit reached!\nRemaining today: ${CURRENCY_SYMBOL}${formatMoney(DAILY_TRANSFER_LIMIT - userData.data.bank.dailyTransfer.amount)}`);
                    }
                    userData.data.bank.dailyTransfer.amount += transferAmount;
                } else {
                    userData.data.bank.dailyTransfer = { date: today, amount: transferAmount };
                }

                // ২. যাকে টাকা পাঠাবেন তাকে MongoDB তে খোঁজা (যদি আগে না খোঁজা হয়ে থাকে)
                let targetUser = await User.findOne({ userID: targetID });
                
                if (!targetUser || !targetUser.data || !targetUser.data.bank || !targetUser.data.bank.accountNumber) {
                    return message.reply("❌ Recipient doesn't have a bank account or is not registered!");
                }

                // ৩. ট্রানজেকশন অবজেক্ট তৈরি করা
                transaction = { 
                    transactionId: generateTransactionId(),
                    type: "transfer",
                    amount: transferAmount,
                    fromAccount: userData.data.bank.accountNumber,
                    toAccount: targetUser.data.bank.accountNumber,
                    newBalance: userData.data.bank.balance - transferAmount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: `Transfer to ${targetUser.name || targetID}`
                };

                const receiverTransaction = {
                    transactionId: transaction.transactionId,
                    type: "received",
                    amount: transferAmount,
                    fromAccount: userData.data.bank.accountNumber,
                    toAccount: targetUser.data.bank.accountNumber,
                    newBalance: targetUser.data.bank.balance + transferAmount,
                    timestamp: transaction.timestamp,
                    description: `Received from ${userData.name || senderID}`
                };

                // ৪. প্রেরকের ডাটা আপডেট (Sender Data Update)
                userData.data.bank.balance -= transferAmount;
                userData.data.bank.totalTransferred = (userData.data.bank.totalTransferred || 0) + transferAmount;
                
                if (!userData.data.bank.transactions) userData.data.bank.transactions = [];
                userData.data.bank.transactions.unshift(transaction);
                if (userData.data.bank.transactions.length > 50) {
                    userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                }

                // ৫. গ্রাহকের ডাটা আপডেট (Receiver Data Update)
                targetUser.data.bank.balance += transferAmount;
                if (!targetUser.data.bank.transactions) targetUser.data.bank.transactions = [];
                targetUser.data.bank.transactions.unshift(receiverTransaction);
                if (targetUser.data.bank.transactions.length > 50) {
                    targetUser.data.bank.transactions = targetUser.data.bank.transactions.slice(0, 50);
                }

                // ৬. MongoDB তে সেভ করা (Save both users)
                userData.markModified('data');
                await userData.save();
                
                targetUser.markModified('data');
                await targetUser.save();

                // ৭. ট্রানজেকশন রিসিপ্ট তৈরি ও রিপ্লাই
                const receiptPath = await createTransactionReceipt(transaction, userData);
                return message.reply({
                    body: `✅ [ TRANSFER SUCCESS ]\n\n💰 Amount: ${CURRENCY_SYMBOL}${formatMoney(transferAmount)}\n👤 To: ${targetUser.name || targetID}\n🔖 Transaction ID: ${transaction.transactionId}`,
                    attachment: fs.createReadStream(receiptPath)
                }, () => fs.unlinkSync(receiptPath));
            }

                                // ১. MongoDB তে ডাটা সেভ করা (প্রেরক এবং গ্রাহক উভয়ের জন্য)
                userData.markModified('data');
                await userData.save();
                
                targetUser.markModified('data'); // এখানে targetUser নিশ্চিত করুন
                await targetUser.save();

                const receiptPath = await createTransactionReceipt(transaction, userData, targetUser);
                return message.reply({
                    body: `✅ [ TRANSFER SUCCESS ]\n\n🔄 TRANSFER DETAILS\n━━━━━━━━━━━━━━━━━\n📤 From: ${userData.name || "Sender"}\n📥 To: ${targetUser.name || "Recipient"}\n💰 Amount: ${CURRENCY_SYMBOL}${formatMoney(transferAmount)}\n💳 Your Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}\n🔖 ID: ${transaction.transactionId}`,
                    attachment: fs.createReadStream(receiptPath)
                }, () => fs.unlinkSync(receiptPath));
            }

            case "history":
            case "his": {
                if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                    return message.reply("⚠️ You don't have a bank account to view history.");
                }
                
                const transactions = userData.data.bank.transactions || [];
                if (transactions.length === 0) {
                    return message.reply("📋 You have no transaction history yet.");
                }

                const displayLimit = transactions.slice(0, 10);
                let historyMsg = `📜 TRANSACTION HISTORY\n━━━━━━━━━━━━━━━━━\n`;
                
                displayLimit.forEach((tx, i) => {
                    const icon = tx.type === "deposit" ? "💰" : 
                                tx.type === "withdraw" ? "💸" : 
                                tx.type === "transfer" ? "📤" : 
                                tx.type === "received" ? "📥" : "📋";
                    const sign = ["deposit", "received"].includes(tx.type) ? "+" : "-";
                    historyMsg += `${i + 1}. ${icon} ${tx.type.toUpperCase()}\n`;
                    historyMsg += `   ${sign}${CURRENCY_SYMBOL}${formatMoney(tx.amount)} | ${tx.timestamp.split(" ")[0]}\n`;
                });

                return message.reply(historyMsg);
            }

            case "card": {
                if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                    return message.reply("⚠️ You don't have a bank account to manage cards.");
                }

                const cardAction = args[1]?.toLowerCase();

                if (!cardAction) {
                    // কার্ড না থাকলে জেনারেট করা বা মেসেজ দেওয়া
                    if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) {
                        return message.reply("❌ You don't have any ATM cards. Use 'bank card issue' to get one.");
                    }

                    const card = userData.data.bank.cards[0];
                    const cardPath = await createBankCard(card, userData);
                    
                    return message.reply({
                        body: `💳 YOUR ATM CARD\n━━━━━━━━━━━━━━━━━\n📋 Card No: ${formatCardNumber(card.cardNumber)}\n📅 Expiry: ${card.expiryDate}\n🔒 Status: ${card.isActive ? "Active ✅" : "Blocked ❌"}\n💎 Type: ${card.cardType.toUpperCase()}\n━━━━━━━━━━━━━━━━━\n⚠️ CVV and PIN shown on card back`,
                        attachment: fs.createReadStream(cardPath)
                    }, () => fs.unlinkSync(cardPath));
                }

                                switch (cardAction) {
                    case "apply":
                    case "issue": {
                        // ১. চেক করা যে ইউজারের আগে থেকে কার্ড আছে কিনা
                        if (userData.data.bank.cards && userData.data.bank.cards.length > 0) {
                            return message.reply("❌ You already have an active card! You cannot apply for a new one.");
                        }

                        const cardType = args[2]?.toLowerCase() || "standard";
                        if (!["standard", "gold", "platinum"].includes(cardType)) {
                            return message.reply("❌ Invalid card type! Available types: Standard, Gold, Platinum.");
                        }

                        // ২. কার্ড টাইপ অনুযায়ী মিনিমাম ব্যালেন্স চেক
                        const minBalance = cardType === "platinum" ? 50000 : cardType === "gold" ? 10000 : 0;
                        if (userData.data.bank.balance < minBalance) {
                            return message.reply(`❌ Insufficient balance! Minimum balance required for a ${cardType.toUpperCase()} card is ${CURRENCY_SYMBOL}${formatMoney(minBalance)}.`);
                        }

                        // ৩. নতুন কার্ডের তথ্য জেনারেট করা
                        const pin = generatePIN(); // এটি আপনার ফাংশন থেকে পিন তৈরি করবে
                        const newCard = {
                            cardNumber: generateCardNumber(),
                            cvv: generateCVV(),
                            pin: hashPIN(pin), // পিন হ্যাশ করা
                            expiryDate: getExpiryDate(),
                            cardType: cardType,
                            isActive: true,
                            issuedAt: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                            accountNumber: userData.data.bank.accountNumber
                        };

                        // ৪. ডাটাবেসে কার্ড পুশ করা
                        if (!userData.data.bank.cards) userData.data.bank.cards = [];
                        userData.data.bank.cards.push(newCard);

                        // ৫. MongoDB তে সেভ করা
                        userData.markModified('data');
                        await userData.save();

                        // ৬. ইউজারকে পিন সহ কনফার্মেশন দেওয়া
                        return message.reply(
                            `🎉 [ CARD ISSUED SUCCESS ]\n━━━━━━━━━━━━━━━━━━\n` +
                            `💳 Card Type: ${cardType.toUpperCase()}\n` +
                            `🔢 Card No: ${formatCardNumber(newCard.cardNumber)}\n` +
                            `🔐 Default PIN: ${pin}\n` +
                            `📅 Expiry: ${newCard.expiryDate}\n` +
                            `━━━━━━━━━━━━━━━━━━\n` +
                            `⚠️ Please remember your PIN. Do not share it with anyone!`
                        );
                    }

                                                // কার্ড সেভ এবং রিসিপ্ট পাঠানো (Apply এর বাকি অংশ)
                        userData.data.bank.cards = [newCard];
                        userData.markModified('data');
                        await userData.save();

                        const cardPath = await createBankCard(newCard, userData);
                        return message.reply({
                            body: `🎉 [ NEW CARD ISSUED ]\n━━━━━━━━━━━━━━━━━━\n` +
                            `📋 Card No: ${formatCardNumber(newCard.cardNumber)}\n` +
                            `📅 Expiry: ${newCard.expiryDate}\n` +
                            `🔐 CVV: ${newCard.cvv}\n` +
                            `🔑 PIN: ${pin}\n` +
                            `💎 Type: ${cardType.toUpperCase()}\n` +
                            `━━━━━━━━━━━━━━━━━━\n` +
                            `⚠️ Keep your PIN safe! Do not share it with anyone.`,
                            attachment: fs.createReadStream(cardPath)
                        }, () => fs.unlinkSync(cardPath));
                    }

                    case "activate": {
                        if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) {
                            return message.reply("❌ You don't have any ATM card to activate.");
                        }
                        
                        userData.data.bank.cards[0].isActive = true;
                        userData.markModified('data');
                        await userData.save();
                        
                        return message.reply("✅ Your card has been successfully activated!");
                    }

                    case "block": {
                        if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) {
                            return message.reply("❌ You don't have any ATM card to block.");
                        }
                        
                        userData.data.bank.cards[0].isActive = false;
                        userData.markModified('data');
                        await userData.save();
                        
                        return message.reply("🔒 Your card has been blocked for security reasons.");
                    }

                    case "pin": {
                        if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) {
                            return message.reply("❌ You don't have any ATM card to change PIN.");
                        }
                        
                        const newPin = args[2];
                        if (!newPin || !/^\d{4}$/.test(newPin)) {
                            return message.reply("❌ Invalid PIN! Please provide a 4-digit numeric PIN.");
                        }
                        
                        userData.data.bank.cards[0].pin = hashPIN(newPin);
                        userData.markModified('data');
                        await userData.save();
                        
                        return message.reply("✅ Your ATM PIN has been changed successfully!");
                    }

                    default:
                        return message.reply(`💳 [ CARD SERVICES ]\n━━━━━━━━━━━━━━━━━━\n` +
                            `• card - View your current card\n` +
                            `• card apply <type> - Apply for a card\n` +
                            `• card activate - Activate your card\n` +
                            `• card block - Block your card\n` +
                            `• card pin <4 digits> - Change PIN\n\n` +
                            `💎 Card Types: Standard, Gold, Platinum`);
                }
            }

                        case "savings":
            case "save": {
                if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                    return message.reply("⚠️ You don't have a bank account. Register first!");
                }

                const savingsAction = args[1]?.toLowerCase();

                if (!savingsAction) {
                    return message.reply(`🏧 [ SAVINGS ACCOUNT ]\n━━━━━━━━━━━━━━━━━━\n` +
                        `💎 Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.savings || 0)}\n` +
                        `📈 Interest Rate: ${INTEREST_RATE * 100}% daily\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `Commands:\n` +
                        `• savings deposit <amount>\n` +
                        `• savings withdraw`);
                }

                            case "savings":
            case "save": {
                if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                    return message.reply("⚠️ You don't have a bank account. Register first to use savings!");
                }

                const savingsAction = args[1]?.toLowerCase();

                if (!savingsAction) {
                    return message.reply(`🏧 [ SAVINGS ACCOUNT ]\n━━━━━━━━━━━━━━━━━\n💎 Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.savings || 0)}\n📈 Interest Rate: ${INTEREST_RATE * 100}% daily\n━━━━━━━━━━━━━━━━━\nCommands:\n• savings deposit <amount>\n• savings withdraw`);
                }

                                        case "withdraw":
                    case "wd": {
                        if (!userData.data.bank.savings || userData.data.bank.savings <= 0) {
                            return message.reply("❌ You don't have any savings to withdraw.");
                        }

                        const lastInterest = userData.data.bank.lastInterest;
                        let interest = 0;
                        if (lastInterest) {
                            const days = moment().diff(moment(lastInterest, "DD/MM/YYYY"), "days");
                            interest = Math.floor(userData.data.bank.savings * INTEREST_RATE * days);
                        }

                        const total = userData.data.bank.savings + interest;
                        
                        // ডাটা আপডেট
                        userData.data.bank.balance += total;
                        const withdrawnAmount = userData.data.bank.savings; // মেসেজের জন্য রাখা হলো
                        userData.data.bank.savings = 0;
                        userData.data.bank.lastInterest = null;

                        const transaction = {
                            transactionId: generateTransactionId(),
                            type: "savings_withdraw",
                            amount: total,
                            newBalance: userData.data.bank.balance,
                            timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                            description: `Savings withdrawal + ${CURRENCY_SYMBOL}${formatMoney(interest)} interest`
                        };
                        
                        if (!userData.data.bank.transactions) userData.data.bank.transactions = [];
                        userData.data.bank.transactions.unshift(transaction);

                        // MongoDB তে সেভ
                        userData.markModified('data');
                        await userData.save();

                        return message.reply(`✅ [ SAVINGS WITHDRAWN ]\n\n💎 Withdrawn: ${CURRENCY_SYMBOL}${formatMoney(withdrawnAmount)}\n📈 Interest Earned: ${CURRENCY_SYMBOL}${formatMoney(interest)}\n💰 Total Added: ${CURRENCY_SYMBOL}${formatMoney(total)}\n💳 Bank Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}`);
                    }

                    default:
                        return message.reply(`🏧 [ SAVINGS COMMANDS ]\n• savings deposit <amount>\n• savings withdraw`);
                }
            }

                        case "statement":
            case "stmt": {
                if (!userData || !userData.data || !userData.data.bank || !userData.data.bank.accountNumber) {
                    return message.reply("⚠️ You don't have a bank account. Register first to view statement!");
                }

                let statementMsg = `📑 [ ACCOUNT STATEMENT ]\n━━━━━━━━━━━━━━━━━━━━━\n🏦 ${BANK_NAME}\n👤 ${userData.name}\n📋 ${userData.data.bank.accountNumber}\n━━━━━━━━━━━━━━━━━━━━━\n\n💰 Current Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}\n💎 Savings: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.savings || 0)}\n\n📊 STATISTICS\n━━━━━━━━━━━━━━━━━━━━━\n📥 Total Deposited: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.totalDeposited || 0)}\n📤 Total Withdrawn: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.totalWithdrawn || 0)}\n🔄 Total Transferred: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.totalTransferred || 0)}\n\n💳 CARDS: ${userData.data.bank.cards?.length || 0}\n📋 Transactions: ${userData.data.bank.transactions?.length || 0}\n\n📅 Account Opened: ${userData.data.bank.createdAt}\n━━━━━━━━━━━━━━━━━━━━━\nThank you for banking with us!`;

                return message.reply(statementMsg);
            }

            default:
                return message.reply("💡 Invalid command! Use 'bank help' to see all options.");

        } // switch শেষ

        // টাকা বিয়োগ বা যোগ করার পর MongoDB তে সেভ করার পদ্ধতি
        userData.markModified('data');
        await userData.save();

    } catch (error) {
        console.error(error);
        return message.reply("❌ An error occurred while accessing the banking system.");
    }
}
};
