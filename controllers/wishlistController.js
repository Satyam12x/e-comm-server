import User from '../models/User.js';
import Product from '../models/Product.js';
import logger from '../config/logger.js';

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price comparePrice images category stock featured'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { wishlist: user.wishlist || [] },
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const user = await User.findById(req.user._id);

    // Check if already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    user.wishlist.push(productId);
    await user.save();
    await user.populate({
      path: 'wishlist',
      select: 'name price comparePrice images category stock featured'
    });

    logger.info(`Product added to wishlist: ${product.name} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Product added to wishlist',
      data: { wishlist: user.wishlist },
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const index = user.wishlist.indexOf(productId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in wishlist',
      });
    }

    user.wishlist.splice(index, 1);
    await user.save();
    await user.populate({
      path: 'wishlist',
      select: 'name price comparePrice images category stock featured'
    });

    res.json({
      success: true,
      message: 'Product removed from wishlist',
      data: { wishlist: user.wishlist },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const user = await User.findById(req.user._id);
    const index = user.wishlist.indexOf(productId);

    let message;
    if (index === -1) {
      user.wishlist.push(productId);
      message = 'Product added to wishlist';
      logger.info(`Product added to wishlist: ${product.name} by user: ${req.user.email}`);
    } else {
      user.wishlist.splice(index, 1);
      message = 'Product removed from wishlist';
      logger.info(`Product removed from wishlist: ${product.name} by user: ${req.user.email}`);
    }

    await user.save();
    await user.populate({
      path: 'wishlist',
      select: 'name price comparePrice images category stock featured'
    });

    res.json({
      success: true,
      message,
      data: { wishlist: user.wishlist },
    });
  } catch (error) {
    next(error);
  }
};
