const cloudinary = require('../config/cloudinary');
const path = require('path');

async function uploadLogo() {
  try {
    const result = await cloudinary.uploader.upload(
      path.join(__dirname, '../assets/pdrrmc-logo.png'),
      {
        public_id: 'pdrrmc-abra/logo',
        overwrite: true,
        resource_type: 'image'
      }
    );
    console.log('Logo uploaded successfully:', result.secure_url);
  } catch (error) {
    console.error('Error uploading logo:', error);
  }
}

uploadLogo();