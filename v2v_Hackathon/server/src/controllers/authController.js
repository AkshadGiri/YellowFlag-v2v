const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const User = require("../models/User");
const { reverseGeocode } = require("../services/geocodingService");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error("Please provide name, email, password and phone");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password, phone });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id),
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id),
    },
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("trustedContacts");
  res.json({ success: true, data: user });
});

// @desc    Update logged-in user's current location (background pings)
// @route   PATCH /api/auth/location
// @access  Private
const updateMyLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error("lat and lng are required");
  }

  const address = await reverseGeocode(lat, lng);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      lastLocation: {
        type: "Point",
        coordinates: [lng, lat],
        address,
        updatedAt: new Date(),
      },
    },
    { new: true }
  );

  res.json({ success: true, data: { location: user.lastLocation } });
});

module.exports = { registerUser, loginUser, getMe, updateMyLocation };
