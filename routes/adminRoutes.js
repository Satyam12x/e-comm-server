import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics/sales', adminController.getSalesAnalytics);
router.get('/analytics/products', adminController.getProductAnalytics);
router.get('/orders/:orderId/logs', adminController.getOrderLogs);

export default router;
