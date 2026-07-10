const asyncHandler = require("../utils/asyncHandler");
const TrustedContact = require("../models/TrustedContact");
const User = require("../models/User");

// @desc    Add a trusted contact
// @route   POST /api/contacts
// @access  Private
const addContact = asyncHandler(async (req, res) => {
  const { name, phone, email, relation, notifyBy, isPrimary } = req.body;

  if (!name || !phone) {
    res.status(400);
    throw new Error("Contact name and phone are required");
  }

  const contact = await TrustedContact.create({
    user: req.user._id,
    name,
    phone,
    email,
    relation,
    notifyBy,
    isPrimary,
  });

  await User.findByIdAndUpdate(req.user._id, { $push: { trustedContacts: contact._id } });

  res.status(201).json({ success: true, data: contact });
});

// @desc    Get all trusted contacts for logged-in user
// @route   GET /api/contacts
// @access  Private
const getContacts = asyncHandler(async (req, res) => {
  const contacts = await TrustedContact.find({ user: req.user._id });
  res.json({ success: true, count: contacts.length, data: contacts });
});

// @desc    Update a trusted contact
// @route   PATCH /api/contacts/:id
// @access  Private
const updateContact = asyncHandler(async (req, res) => {
  const contact = await TrustedContact.findOne({ _id: req.params.id, user: req.user._id });

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  Object.assign(contact, req.body);
  await contact.save();

  res.json({ success: true, data: contact });
});

// @desc    Delete a trusted contact
// @route   DELETE /api/contacts/:id
// @access  Private
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await TrustedContact.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  await User.findByIdAndUpdate(req.user._id, { $pull: { trustedContacts: contact._id } });

  res.json({ success: true, message: "Contact removed" });
});

module.exports = { addContact, getContacts, updateContact, deleteContact };
