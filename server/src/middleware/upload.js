const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.IMAGE_SIZE_LIMIT || "5242880", 10),
  },
  fileFilter: (req, file, cb) => {
    // Verify the image file by checking content type and not mime type.
    // file.headers['content-type'] is the content-type of the part sent by the client.
    const contentType = file.headers && file.headers["content-type"]
      ? file.headers["content-type"]
      : file.mimetype;
    
    if (!contentType || !contentType.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

const multerUpload = upload.single("avatar");

const uploadAvatar = (req, res, next) => {
  multerUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          const limit = process.env.IMAGE_SIZE_LIMIT || "5242880";
          const limitMb = (parseInt(limit, 10) / (1024 * 1024)).toFixed(1);
          return res.status(400).json({ message: `File size limit exceeded. Max size is ${limitMb}MB.` });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadAvatar,
};
