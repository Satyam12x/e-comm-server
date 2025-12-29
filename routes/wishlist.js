import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} from '../controllers/wishlistController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.delete('/remove/:productId', removeFromWishlist);
router.put('/toggle', toggleWishlist);

export default router;
