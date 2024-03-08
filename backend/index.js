const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
dotenv.config();
const { MONGO_URL } = process.env;
const PORT = 8000;

const server = app.listen(PORT, () => {
  console.log(`${PORT}`);
});

app.use(cors());

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});
let teams = [];
io.on("connection", (socket) => {
  console.log("connected to socket.io");

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

  socket.on("bid-player", ({ price, team, bids }) => {
    console.log(price, team, bids);
    io.emit("team-bid", { price, team, bids });
  });
  socket.on("unsold-player", ({ currPlayer, currIdx }) => {
    io.emit("player-unsold", { currPlayer, currIdx });
  });
  socket.on("withraw-bid", ({ team, bids, currPlayer, currIdx }) => {
    console.log("withdrawn by iteseld", currPlayer);
    io.emit("withdrawn-bid", { bids, team, currPlayer, currIdx });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.teamName);
    if (socket.teamName) {
      teams = teams.filter((team) => team.name !== socket.teamName);
      io.emit("team-left", {
        teams,
        message: `${socket.teamName} has left the room`,
      });
    }
  });
});
