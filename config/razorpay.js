import Razorpay from 'razorpay';
import logger from './logger.js';

let razorpayInstance = null;
let isTrialMode = process.env.RAZORPAY_TRIAL_MODE === 'true';

const initializeRazorpay = () => {
  if (process.env.RAZORPAY_KEY_ID && 
      process.env.RAZORPAY_KEY_SECRET && 
      !isTrialMode) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay initialized in LIVE mode');
  } else {
    logger.warn('Razorpay running in TRIAL mode - No actual payments will be processed');
    isTrialMode = true;
  }
};

const getRazorpayInstance = () => {
  return razorpayInstance;
};

const isRazorpayTrialMode = () => {
  return isTrialMode;
};

export { initializeRazorpay, getRazorpayInstance, isRazorpayTrialMode };
