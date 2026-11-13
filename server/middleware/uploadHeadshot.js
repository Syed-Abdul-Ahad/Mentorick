const multer = require('multer');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

function uploadToCloudinary(folder) {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `mentorick/${folder}`,
            public_id: `${req.user._id}_${Date.now()}`,
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        );

        Readable.from(req.file.buffer).pipe(uploadStream);
      });

      req.file.cloudinaryUrl = result.secure_url;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function headshotUpload(folder) {
  return [upload.single('headshot'), uploadToCloudinary(folder)];
}

function paymentProofUpload() {
  return [upload.single('proof'), uploadToCloudinary('payment-proofs')];
}

module.exports = { headshotUpload, paymentProofUpload };
