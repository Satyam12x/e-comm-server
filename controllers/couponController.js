import Coupon from '../models/Coupon.js';
import logger from '../config/logger.js';

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);

    logger.info(`Coupon created: ${coupon.code}`);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (req, res, next) => {
  try {
    const { active } = req.query;

    const query = {};
    if (active === 'true') {
      query.isActive = true;
      query.validUntil = { $gte: new Date() };
    }

    const coupons = await Coupon.find(query).sort('-createdAt');

    res.json({
      success: true,
      data: { coupons, count: coupons.length },
    });
  } catch (error) {
    next(error);
  }
};

export const getCouponById = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    res.json({
      success: true,
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    logger.info(`Coupon updated: ${coupon.code}`);

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    logger.info(`Coupon deleted: ${coupon.code}`);

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code',
      });
    }

    const validation = coupon.isValid(req.user?._id, orderAmount);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const discount = coupon.calculateDiscount(orderAmount);

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          calculatedDiscount: discount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateRandomCoupon = async (req, res, next) => {
  try {
    const { prefix = 'SAVE', discountType, discountValue, validDays = 30 } = req.body;

    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${prefix}${randomString}`;

    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + Number(validDays));

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      validFrom,
      validUntil,
      ...req.body,
    });

    logger.info(`Random coupon generated: ${coupon.code}`);

    res.status(201).json({
      success: true,
      message: 'Coupon generated successfully',
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
};
