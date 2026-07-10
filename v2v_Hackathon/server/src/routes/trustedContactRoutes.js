const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
} = require("../controllers/trustedContactController");

router.use(protect); // every route below requires login

router.route("/").post(addContact).get(getContacts);
router.route("/:id").patch(updateContact).delete(deleteContact);

module.exports = router;
