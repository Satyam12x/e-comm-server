import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, orderController.createOrder);
router.post('/verify-payment', protect, orderController.verifyPayment);

router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrderById);

router.get('/', protect, authorize('admin'), orderController.getAllOrders);
router.put('/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);

export default router;
