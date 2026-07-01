const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads');

function makeUploader(subdir) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOADS_ROOT, subdir)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed'), false);
    },
  });
}

function publicUrl(subdir, filename) {
  return `/uploads/${subdir}/${filename}`;
}

module.exports = { makeUploader, publicUrl, UPLOADS_ROOT };
