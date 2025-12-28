const { removeHomeDir, log } = global.utils;

module.exports = {
  config: {
    name: "eval",
    version: "1.7",
    author: "AkHi", // ⚠️ এটি পরিবর্তন করলে কমান্ড কাজ করবে না
    countDown: 5,
    role: 2,
    shortDescription: "Test code quickly",
    longDescription: "Test code quickly",
    category: "owner",
    guide: "{pn} <code to test>" // এখানে 'en' সরিয়ে সরাসরি গাইড দেওয়া হয়েছে
  },

  onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
    
    // --- Author Lock System ---
    const requiredAuthor = "AkHi";
    if (this.config.author !== requiredAuthor) {
      return api.sendMessage(
        `❌ [ AUTHOR LOCK ] ❌\n--------------------------\nWarning: Author name must be "${requiredAuthor}" to use this developer tool.`,
        event.threadID,
        event.messageID
      );
    }
    // ---------------------------

    if (args.length === 0) return message.reply("Please provide code to eval.");

    function output(msg) {
      if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
        msg = msg.toString();
      else if (msg instanceof Map) {
        let text = `Map(${msg.size}) `;
        text += JSON.stringify(mapToObj(msg), null, 2);
        msg = text;
      }
      else if (typeof msg == "object")
        msg = JSON.stringify(msg, null, 2);
      else if (typeof msg == "undefined")
        msg = "undefined";

      message.reply(msg);
    }

    function out(msg) {
      output(msg);
    }

    function mapToObj(map) {
      const obj = {};
      map.forEach(function (v, k) {
        obj[k] = v;
      });
      return obj;
    }

    const cmd = `
    (async () => {
      try {
        ${args.join(" ")}
      }
      catch(err) {
        console.error("eval command error:", err);
        message.send(
          "✗ An error occurred:\\n" +
          (err.stack ?
            removeHomeDir(err.stack) :
            removeHomeDir(JSON.stringify(err, null, 2) || "")
          )
        );
      }
    })()`;

    try {
      eval(cmd);
    } catch (e) {
      message.send("✗ Eval initialization error: " + e.message);
    }
  }
};
