import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import logger from '../config/logger.js';

export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment, images } = req.body;

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      'payment.status': 'completed',
    });

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating,
      title,
      comment,
      images,
      verified: !!hasPurchased,
    });

    await Product.findByIdAndUpdate(productId, {
      $push: { reviews: review._id },
    });

    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      'rating.average': avgRating.toFixed(1),
      'rating.count': reviews.length,
    });

    logger.info(`Review created for product ${productId} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      data: { reviews, count: reviews.length },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const productId = review.product;

    await review.deleteOne();

    await Product.findByIdAndUpdate(productId, {
      $pull: { reviews: review._id },
    });

    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    await Product.findByIdAndUpdate(productId, {
      'rating.average': avgRating.toFixed(1),
      'rating.count': reviews.length,
    });

    logger.info(`Review deleted: ${review._id}`);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
