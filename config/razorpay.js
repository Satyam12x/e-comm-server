import Razorpay from 'razorpay';
import logger from './logger.js';

let razorpayInstance = null;
let isTrialMode = process.env.RAZORPAY_TRIAL_MODE === 'true';
let isInitialized = false;

const initializeRazorpay = () => {
  // ✅ Prevent re-initialization
  if (isInitialized) {
    return;
  }

  if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !isTrialMode
  ) {
    try {
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      isInitialized = true;
      logger.info('Razorpay initialized in LIVE mode');
    } catch (error) {
      logger.error(`Razorpay initialization error: ${error.message}`);
      isTrialMode = true;
    }
  } else {
    logger.warn('Razorpay running in TRIAL mode - No actual payments will be processed');
    isTrialMode = true;
    isInitialized = true;
  }
};

const getRazorpayInstance = () => {
  return razorpayInstance;
};

const isRazorpayTrialMode = () => {
  return isTrialMode;
};

export { initializeRazorpay, getRazorpayInstance, isRazorpayTrialMode };
