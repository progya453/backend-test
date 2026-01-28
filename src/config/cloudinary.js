const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// 1. Configure Cloudinary (using your env variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME, // Matches your .env
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Define Storage Settings (This does the uploading automatically)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'science_rush_profiles', // Cloudinary folder name
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // Resize huge images
  },
});

module.exports = { cloudinary, storage };