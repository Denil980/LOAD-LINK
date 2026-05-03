const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// Storage setup
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
    // Vercel / Production Cloudinary Storage
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'loadlink_documents',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
            public_id: (req, file) => uuidv4()
        }
    });
} else {
    // Local fallback for development
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${uuidv4()}${ext}`);
        }
    });
}

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Cloudinary storage already handles format validation, but keeping this for local
    if (process.env.CLOUDINARY_CLOUD_NAME) {
         cb(null, true);
    } else {
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only images and PDFs are allowed'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

module.exports = upload;
