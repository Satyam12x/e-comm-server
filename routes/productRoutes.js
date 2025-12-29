import express from 'express';
import * as productController from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';
import { validateProduct } from '../middleware/validator.js';

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);

router.post(
  '/',
  protect,
  authorize('admin'),
  uploadProductImages,
  validateProduct,
  productController.createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadProductImages,
  productController.updateProduct
);

router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);

export default router;
