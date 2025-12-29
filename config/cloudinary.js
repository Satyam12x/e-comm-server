import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

const configureCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    logger.info('Cloudinary configured successfully');
  } else {
    logger.warn('Cloudinary credentials not found - Image uploads will be disabled');
  }
};

export { cloudinary, configureCloudinary };
