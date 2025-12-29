import express from 'express';
import * as couponController from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCoupon } from '../middleware/validator.js';

const router = express.Router();

router.post('/validate', couponController.validateCoupon);

router.get('/', protect, authorize('admin'), couponController.getAllCoupons);
router.get('/:id', protect, authorize('admin'), couponController.getCouponById);
router.post('/', protect, authorize('admin'), validateCoupon, couponController.createCoupon);
router.post('/generate', protect, authorize('admin'), couponController.generateRandomCoupon);
router.put('/:id', protect, authorize('admin'), couponController.updateCoupon);
router.delete('/:id', protect, authorize('admin'), couponController.deleteCoupon);

export default router;
