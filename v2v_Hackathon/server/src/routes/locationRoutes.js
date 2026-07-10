const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  reverseGeocodeHandler,
  forwardGeocodeHandler,
} = require("../controllers/locationController");

router.use(protect);

router.get("/reverse-geocode", reverseGeocodeHandler);
router.get("/geocode", forwardGeocodeHandler);

module.exports = router;
