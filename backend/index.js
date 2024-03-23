const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const app = express();
require("./models/auction");
dotenv.config();
const { MONGO_URL } = process.env;
const PORT = 8000;

mongoose.connect(MONGO_URL);

mongoose.connection.on("connected", () => {
  console.log("connected to the server yeah!");
});
mongoose.connection.on("error", (err) => {
  console.log("err connecting ", err);
});

const server = app.listen(PORT, "::1", () => {
  console.log(`${PORT}`);
});

app.use(express.json());
app.use(cors());
app.use(require("./routes/auction"));

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
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
    socket.roomId = roomId;
    console.log(name);
    teams.push({ name, logo, purse });

    io.to(roomId).emit("joined-room", {
      teams,
      message: `${name} has joined the room`,
    });
  });

  socket.on("bid-player", ({ price, team, bids, logo }) => {
    io.emit("team-bid", { price, team, bids, logo });
  });
  socket.on("unsold-player", async ({ currPlayer, currIdx }) => {
    const roomId = socket.roomId;
    try {
      await axios.put(`http://localhost:8000/player-sold?id=${roomId}`, {
        sold: false,
        playerDetail: currPlayer,
      });
    } catch (err) {
      console.log("err", err);
    }

    io.emit("player-unsold", { currPlayer, currIdx });
  });
  socket.on("withraw-bid", async ({ team, bids, currPlayer, currIdx }) => {
    const keys = Object.keys(bids);
    const roomId = socket.roomId;
    console.log("rrom", roomId);
    const findPlayer = players.find((player) => player.name == currPlayer.name);
    if (keys.length == 1 && !findPlayer) {
      decreasePurse(keys[0], bids[keys[0]]);
      const finalPlayerData = { ...currPlayer, team: keys[0] };
      players.push(finalPlayerData);
      try {
        await axios.put(`http://localhost:8000/player-sold?id=${roomId}`, {
          sold: true,
          teamName: keys[0],
          playerDetail: finalPlayerData,
        });
      } catch (err) {
        console.log("err", err);
      }
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
