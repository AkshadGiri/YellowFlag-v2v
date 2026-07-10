const asyncHandler = require("../utils/asyncHandler");
const { reverseGeocode, forwardGeocode } = require("../services/geocodingService");

// @desc    Coordinates -> readable address
// @route   GET /api/location/reverse-geocode?lat=..&lng=..
// @access  Private
const reverseGeocodeHandler = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error("lat and lng query params are required");
  }

  const address = await reverseGeocode(Number(lat), Number(lng));
  res.json({ success: true, data: { address } });
});

// @desc    Address -> coordinates
// @route   GET /api/location/geocode?address=...
// @access  Private
const forwardGeocodeHandler = asyncHandler(async (req, res) => {
  const { address } = req.query;
  if (!address) {
    res.status(400);
    throw new Error("address query param is required");
  }

  const coords = await forwardGeocode(address);
  if (!coords) {
    res.status(404);
    throw new Error("Could not resolve coordinates for that address");
  }

  res.json({ success: true, data: coords });
});

module.exports = { reverseGeocodeHandler, forwardGeocodeHandler };
