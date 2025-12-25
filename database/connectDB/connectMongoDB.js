const mongoose = require("mongoose");

module.exports = async function (uriConnect) {
    // সরাসরি আপনার লিঙ্কটি ব্যবহার করা হয়েছে
    const mongoURI = "mongodb+srv://shahryarsabu_db_user:8wKHzzXFdeX3zlEK@cluster0.rbclxsq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    const threadModel = require("../models/mongodb/thread.js");
    const userModel = require("../models/mongodb/user.js");
    const dashBoardModel = require("../models/mongodb/userDashBoard.js");
    const globalModel = require("../models/mongodb/global.js");

    try {
        // এখানে পুরনো অপশনগুলো (useNewUrlParser ইত্যাদি) সরিয়ে দেওয়া হয়েছে
        await mongoose.connect(mongoURI);
        
        console.log("✅ [DATABASE] MongoDB Cloud Connected Successfully!");
    } catch (error) {
        console.error("❌ [DATABASE] MongoDB Connection Error: ", error.message);
    }

    return {
        threadModel,
        userModel,
        dashBoardModel,
        globalModel
    };
};
