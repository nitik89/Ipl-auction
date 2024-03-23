const mongoose = require("mongoose");
const auctionSchema = new mongoose.Schema(
  {
    teams: {
      type: Array,
      required: true,
    },
    unsold: {
      type: Array,
      required: true,
    },
    playersSold: {
      type: Array,
      required: true,
    },
  },
  { timestamps: true }
);

mongoose.model("Auction", auctionSchema);
