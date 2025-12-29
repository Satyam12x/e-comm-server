import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { getRazorpayInstance, isRazorpayTrialMode } from '../config/razorpay.js';
import crypto from 'crypto';
import logger from '../config/logger.js';

export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'razorpay' } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`,
        });
      }
    }

    cart.calculateTotals();

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0]?.url,
      quantity: item.quantity,
      price: item.price,
    }));

    const shippingCost = cart.total >= 1000 ? 0 : 50;
    const codFee = paymentMethod === 'cod' ? 50 : 0;
    const tax = Math.round((cart.total + shippingCost + codFee) * 0.18);
    const totalAmount = cart.total + shippingCost + codFee + tax;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      pricing: {
        subtotal: cart.subtotal,
        discount: cart.discount,
        shipping: shippingCost,
        handlingFee: codFee,
        tax,
        total: totalAmount,
      },
      coupon: cart.coupon
        ? { code: cart.coupon.code, discount: cart.discount }
        : undefined,
      payment: {
        method: paymentMethod === 'cod' ? 'cod' : (isRazorpayTrialMode() ? 'trial' : 'razorpay'),
        status: paymentMethod === 'cod' ? 'pending' : (isRazorpayTrialMode() ? 'completed' : 'pending'),
      },
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          message: 'Order created',
        },
      ],
    });

    let razorpayOrder = null;

    if (!isRazorpayTrialMode() && paymentMethod !== 'cod') {
      const razorpay = getRazorpayInstance();
      razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: order.orderNumber,
      });

      order.payment.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    logger.info(`Order created: ${order.orderNumber} by user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        razorpayOrder,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        trialMode: isRazorpayTrialMode(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (isRazorpayTrialMode()) {
      order.payment.status = 'completed';
      order.payment.paidAt = Date.now();
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        message: 'Payment completed (Trial Mode)',
      });
    } else {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        order.payment.status = 'failed';
        await order.save();

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }

      order.payment.razorpayPaymentId = razorpayPaymentId;
      order.payment.razorpaySignature = razorpaySignature;
      order.payment.status = 'completed';
      order.payment.paidAt = Date.now();
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        message: 'Payment verified successfully',
      });
    }

    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    if (order.coupon?.code) {
      await Coupon.findOneAndUpdate(
        { code: order.coupon.code },
        {
          $inc: { usedCount: 1 },
          $push: {
            usedBy: {
              user: req.user._id,
              usedAt: Date.now(),
            },
          },
        }
      );
    }

    await User.findByIdAndUpdate(req.user._id, {
      $push: { orders: order._id },
    });

    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], coupon: undefined, subtotal: 0, discount: 0, total: 0 }
    );

    logger.info(`Payment verified: Order ${order.orderNumber}`);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort('-createdAt');

    res.json({
      success: true,
      data: { orders, count: orders.length },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, message, trackingInfo } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (status) {
      order.status = status;
      order.statusHistory.push({
        status,
        message: message || `Order status updated to ${status}`,
      });
    }

    if (trackingInfo) {
      order.trackingInfo = trackingInfo;
    }

    await order.save();

    logger.info(`Order status updated: ${order.orderNumber} to ${status}`);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
