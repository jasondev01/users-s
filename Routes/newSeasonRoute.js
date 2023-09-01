const express = require("express");
const { 
    fetchSeasonAndUpdate,
    getNewSeason,
} = require("../Controller/newSeasonController")

const router = express.Router();

router.get("/update-newseason", fetchSeasonAndUpdate);
router.post("/new-season", getNewSeason);

module.exports = router;