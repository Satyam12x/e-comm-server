import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addToCart);
router.put('/update', protect, cartController.updateCartItem);
router.delete('/remove/:productId', protect, cartController.removeFromCart);
router.delete('/clear', protect, cartController.clearCart);

router.post('/coupon/apply', protect, cartController.applyCoupon);
router.delete('/coupon/remove', protect, cartController.removeCoupon);

export default router;
