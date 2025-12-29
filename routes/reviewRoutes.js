import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, reviewController.createReview);
router.get('/product/:productId', reviewController.getProductReviews);
router.delete('/:id', protect, reviewController.deleteReview);

export default router;
