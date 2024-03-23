const express = require("express");
const mongoose = require("mongoose");
const Auction = mongoose.model("Auction");
const teamsArr = require("../teams.json");
const router = express.Router();

//"65f4aadf62e2639fbf836718"
router.get("/sold-players", async (req, res) => {
  try {
    const { id } = req.query;
    const auctionRoom = await Auction.findOne({ _id: id });
    res.status(200).json({
      message: "Players Fetched",
      soldPlayers: auctionRoom.playersSold,
    });
  } catch (err) {
    res.status(422).json({ message: "Could get the players" });
  }
});
router.get("/get-squad", async (req, res) => {
  try {
    const { id } = req.query;
    const auctionRoom = await Auction.findOne({ _id: id });
    res.status(200).json({
      message: "Squads Fetched",
      roomDetails: auctionRoom.teams,
    });
  } catch (err) {
    res.status(422).json({ message: "Could get the players" });
  }
});
router.get("/unsold-players", async (req, res) => {
  try {
    const { id } = req.query;
    const auctionRoom = await Auction.findOne({ _id: id });
    res.status(422).json({
      message: "Players Fetched",
      unsoldPlayers: auctionRoom.unsold,
    });
  } catch (err) {
    res.status(422).json({ message: "Could get the players" });
  }
});

router.get("/players-myteam", async (req, res) => {
  try {
    const { id, name } = req.query;
    const auctionRoom = await Auction.findOne({ _id: id });
    const { teams } = auctionRoom;
    teams.map((team) => {
      if (team.name == name) {
        return res.status(422).json({
          message: "Players Fetched",
          team,
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(422).json({ message: "Could get the players", err });
  }
});
router.put("/player-sold", async (req, res) => {
  try {
    const { id } = req.query;
    console.log(id);
    const { teamName, playerDetail, sold } = req.body;
    const { role, price } = playerDetail;
    console.log(id, playerDetail);
    const auctionRoom = await Auction.findOne({ _id: id });
    const { teams } = auctionRoom;
    if (sold) {
      const updatedTeam = teams.map((team) => {
        if (team.name == teamName) {
          console.log("yes", teamName);
          team[role].push(playerDetail);
          team.purse -= parseInt(price);
        }
        return team;
      });
      auctionRoom.playersSold.push(playerDetail);
      auctionRoom.teamName = updatedTeam;
    } else {
      auctionRoom.unsold.push(playerDetail);
    }
    await Auction.findByIdAndUpdate(id, auctionRoom, {
      new: true,
    });
    res.status(200).json({ message: "Player Saved" });
  } catch (err) {
    console.log(err);
    res.status(422).json({ message: "Error spotted", err });
  }
});

router.post("/create-room", async (req, res) => {
  //   console.log(req.body);
  const teams = teamsArr.map(({ name, purse }) => {
    return {
      name,
      purse,
      ["WK Keeper - Batter"]: [],
      ["Batter"]: [],
      ["All-Rounder"]: [],
      ["Bowler"]: [],
    };
  });

  try {
    const newRoom = new Auction({ teams, unsold: [], playersSold: [] });
    const auctionRoom = await newRoom.save();
    res.status(200).json({ message: "Room Created", auctionRoom });
  } catch (err) {
    res.status(200).json({ err: "error is there" });
  }
});

router.get("/check-room", async (req, res) => {
  try {
    const { id } = req.query;
    const auctionRoom = await Auction.findOne({ _id: id });
    let found = false;
    if (auctionRoom) {
      found = true;
    }
    res.status(200).json({ message: "Room Created", found });
  } catch (err) {
    console.log(err);
    res.status(200).json({ err: "error is there", found: false });
  }
});
module.exports = router;
