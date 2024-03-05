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

  socket.on("joinRoom", ({ roomId, teamName }) => {
    socket.join(roomId);
    socket.teamName = teamName;
    teams.push(teamName);
    io.to(roomId).emit("joined-room", {
      teams,
      message: `${teamName} has joined the room`,
    });
  });

  socket.on("bid-player", ({ price, team, bids }) => {
    io.emit("team-bid", { price, team, bids });
  });
  socket.on("withraw-bid", ({ team, bids }) => {
    console.log("withdrawn by iteseld");
    io.emit("withdrawn-bid", { bids, team });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.teamName);
    if (socket.teamName) {
      teams = teams.filter((team) => team !== socket.teamName);
      io.emit("team-left", {
        teams,
        message: `${socket.teamName} has left the room`,
      });
    }
  });
});
