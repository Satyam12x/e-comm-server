import express from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Authentication routes
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

// Address management
router.post('/address', protect, authController.addAddress);
router.put('/address/:addressId', protect, authController.updateAddress);
router.delete('/address/:addressId', protect, authController.deleteAddress);

export default router;
