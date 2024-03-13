const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
dotenv.config();
const { MONGO_URL } = process.env;
const PORT = 8000;

const server = app.listen(PORT, "::1", () => {
  console.log(`${PORT}`);
});

app.use(cors());

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: [
      "http://localhost:3000",
      "http://192.168.1.8:3000",
      "http://192.168.1.3:3000",
    ],
  },
});
let teams = [];
let players = [];
io.on("connection", (socket) => {
  console.log("connected to socket.io");

  const decreasePurse = (teamName, amount) => {
    const team = teams.find((team) => team.name === teamName);
    if (team) {
      team.purse -= amount;
      return true; // Indicates team found and purse decreased
    }
    return false; // Indicates team not found
  };

  socket.on("joinRoom", ({ name, logo, purse, roomId }) => {
    console.log(name, roomId);
    socket.join(roomId);
    socket.teamName = name;
    teams.push({ name, logo, purse });
    io.to(roomId).emit("joined-room", {
      teams,
      message: `${name} has joined the room`,
    });
  });

  socket.on("bid-player", ({ price, team, bids, logo }) => {
    io.emit("team-bid", { price, team, bids, logo });
  });
  socket.on("unsold-player", ({ currPlayer, currIdx }) => {
    io.emit("player-unsold", { currPlayer, currIdx });
  });
  socket.on("withraw-bid", ({ team, bids, currPlayer, currIdx }) => {
    const keys = Object.keys(bids);
    const findPlayer = players.find(
      (player) =>
        player.name == currPlayer.name && player.logo == currPlayer.logo
    );
    if (keys.length == 1 && !findPlayer) {
      decreasePurse(keys[0], bids[keys[0]]);
      players.push(currPlayer);
    }

    io.emit("withdrawn-bid", { bids, team, currPlayer, currIdx, teams });
  });
  socket.on("disconnect", () => {
    if (socket.teamName) {
      teams = teams.filter((team) => team.name !== socket.teamName);
      io.emit("team-left", {
        teams,
        message: `${socket.teamName} has left the room`,
      });
    }
  });
});
