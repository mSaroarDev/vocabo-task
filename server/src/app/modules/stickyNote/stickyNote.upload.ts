import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import config from "../../config";

const isRemoteStorage = Boolean(
  config.r2.accountId &&
  config.r2.accessKeyId &&
  config.r2.secretAccessKey &&
  config.r2.bucketName &&
  config.r2.publicUrl
);

const UPLOAD_DIR = isRemoteStorage
  ? path.join(os.tmpdir(), "vocabo-uploads", "sticky-notes")
  : path.join(process.cwd(), "uploads", "sticky-notes");

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch {
  // ignore
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `note-img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const noteImageUpload = upload.single("image");

export { noteImageUpload };
