const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const allowedTypes = /jpeg|jpg|png|webp|mp3|wav|m4a|mp4|mov|webm/;

const fileFilter = (req, file, cb) => {
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (ext) return cb(null, true);
  cb(new Error("Unsupported file type for evidence upload"));
};

// NOTE: For a real production deployment, swap diskStorage for direct
// upload to S3 / Cloudinary / Firebase Storage instead of local disk.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max (video evidence)
});

module.exports = upload;
