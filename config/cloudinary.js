import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

// ✅ Track if already configured
let isConfigured = false;

const configureCloudinary = () => {
  // ✅ Prevent reconfiguration
  if (isConfigured) {
    return;
  }

  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      isConfigured = true;
      logger.info('Cloudinary configured successfully');
    } catch (error) {
      logger.error(`Cloudinary configuration error: ${error.message}`);
    }
  } else {
    logger.warn('Cloudinary credentials not found - Image uploads will be disabled');
  }
};

export { cloudinary, configureCloudinary };
