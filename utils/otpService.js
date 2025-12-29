// In-memory OTP storage (use Redis in production for scalability)
const otpStore = new Map();

// OTP expiry time (10 minutes)
const OTP_EXPIRY_TIME = 10 * 60 * 1000;

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP with expiry
 * @param {string} email - User email
 * @param {string} otp - Generated OTP
 */
const storeOTP = (email, otp) => {
  const expiryTime = Date.now() + OTP_EXPIRY_TIME;
  otpStore.set(email, { otp, expiryTime });
  
  // Auto-cleanup after expiry
  setTimeout(() => {
    otpStore.delete(email);
  }, OTP_EXPIRY_TIME);
};

/**
 * Verify OTP
 * @param {string} email - User email
 * @param {string} otp - OTP to verify
 * @returns {boolean} - Verification result
 */
const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return { success: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > stored.expiryTime) {
    otpStore.delete(email);
    return { success: false, message: 'OTP has expired' };
  }
  
  if (stored.otp !== otp) {
    return { success: false, message: 'Invalid OTP' };
  }
  
  // OTP verified successfully, remove from store
  otpStore.delete(email);
  return { success: true, message: 'OTP verified successfully' };
};

/**
 * Check if OTP exists for email
 * @param {string} email - User email
 * @returns {boolean} - Existence check
 */
const hasOTP = (email) => {
  return otpStore.has(email);
};

/**
 * Delete OTP (for cleanup or resend)
 * @param {string} email - User email
 */
const deleteOTP = (email) => {
  otpStore.delete(email);
};

export {
  generateOTP,
  storeOTP,
  verifyOTP,
  hasOTP,
  deleteOTP
};
