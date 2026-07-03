const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AppError } = require('./errors');

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads');

function makeUploader(subdir) {
  const dest = path.join(UPLOADS_ROOT, subdir);
  fs.mkdirSync(dest, { recursive: true });
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
  const uploader = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      // A plain Error here has no statusCode/isOperational, so the global
      // error handler falls through to a raw 500 (with a leaked stack trace
      // in dev). Use AppError so a bad file type is a clean 400.
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new AppError('INVALID_FILE_TYPE', 'Only image files are allowed', 400), false);
    },
  });

  // Wrap each multer method so its own errors (LIMIT_FILE_SIZE, etc., which
  // are MulterError instances — also not AppErrors) are normalized too.
  return {
    single: (field) => (req, res, next) => uploader.single(field)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return next(new AppError('UPLOAD_ERROR', err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5MB)' : err.message, 400));
      }
      next(err);
    }),
  };
}

function publicUrl(subdir, filename) {
  return `/uploads/${subdir}/${filename}`;
}

module.exports = { makeUploader, publicUrl, UPLOADS_ROOT };
