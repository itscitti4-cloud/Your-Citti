const axios = require('axios');

module.exports = {
  config: {
    name: "chess",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Play chess with other members.",
    longDescription: "A fully functional chess game where you can challenge and play against group members.",
    category: "game",
    guide: "{pn} <challenge/move/status/quit> [details]"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, senderID, messageID } = event;
    const action = args[0]?.toLowerCase();

    if (!global.chessGames) global.chessGames = new Map();

    switch (action) {
      case "challenge":
        // 1. Challenge another user
        if (Object.keys(event.mentions).length === 0) return message.reply("Please mention the user you want to challenge.");
        const opponentID = Object.keys(event.mentions)[0];
        
        global.chessGames.set(threadID, {
          white: senderID,
          black: opponentID,
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          turn: senderID
        });
        return message.reply("Chess game started! White (challenger) goes first. Use: !chess move <from-to> (e.g., e2e4)");

      case "move":
        // 2. Make a move
        const game = global.chessGames.get(threadID);
        if (!game) return message.reply("No active chess game in this group. Start one with !chess challenge @mention.");
        if (senderID !== game.turn) return message.reply("It's not your turn!");

        const move = args[1];
        if (!move) return message.reply("Please provide a move (e.g., !chess move e2e4).");

        try {
          message.reply("Validating move and updating board...");
          // Using a chess logic API to update the board image and FEN
          const response = await axios.get(`https://api.chess.sh/v1/game`, {
            params: { fen: game.fen, move: move }
          });

          game.fen = response.data.fen;
          game.turn = game.turn === game.white ? game.black : game.white;

          const boardImageUrl = `https://chess-image-api.vercel.app/board?fen=${encodeURIComponent(game.fen)}`;

          return api.sendMessage({
            body: `✅ Move Successful: ${move}\nNext turn: ${game.turn === game.white ? "White" : "Black"}`,
            attachment: await global.utils.getStreamFromURL(boardImageUrl)
          }, threadID);

        } catch (error) {
          return message.reply("Invalid move! Please use standard algebraic notation (e.g., e2e4, g1f3).");
        }

      case "quit":
        // 3. End the game
        global.chessGames.delete(threadID);
        return message.reply("The chess game has been ended.");

      default:
        return message.reply("Usage: !chess <challenge @mention | move <notation> | quit>");
    }
  }
};
    
