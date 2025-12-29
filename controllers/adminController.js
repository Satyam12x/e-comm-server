import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();

    const completedOrders = await Order.find({
      $or: [{ 'payment.status': 'completed' }, { status: 'delivered' }],
    });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.pricing.total || 0), 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await Order.find({
      createdAt: { $gte: todayStart },
      $or: [{ 'payment.status': 'completed' }, { status: 'delivered' }],
    });
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.pricing.total || 0), 0);

    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    const lowStockProducts = await Product.find({ stock: { $lte: 10 }, isActive: true })
      .select('name stock')
      .limit(10);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(5);

    const topProducts = await Product.find({ isActive: true })
      .sort('-viewCount')
      .limit(5)
      .select('name viewCount rating');

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          totalUsers,
          totalProducts,
          totalRevenue: Math.round(totalRevenue),
          todayRevenue: Math.round(todayRevenue),
        },
        orderStats: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
        },
        lowStockProducts,
        recentOrders,
        topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 12));
        break;
      case 'yearly':
        startDate = new Date(now.setFullYear(now.getFullYear() - 5));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 12));
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate },
      $or: [{ 'payment.status': 'completed' }, { status: 'delivered' }],
    }).sort('createdAt');

    const salesData = {};

    orders.forEach((order) => {
      let key;
      const date = new Date(order.createdAt);

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekNum = Math.ceil((date.getDate()) / 7);
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNum}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!salesData[key]) {
        salesData[key] = { revenue: 0, orders: 0 };
      }

      salesData[key].revenue += order.pricing.total;
      salesData[key].orders += 1;
    });

    const chartData = Object.keys(salesData).map((key) => ({
      period: key,
      revenue: Math.round(salesData[key].revenue),
      orders: salesData[key].orders,
    }));

    res.json({
      success: true,
      data: { chartData },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductAnalytics = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('name stock viewCount rating')
      .sort('-viewCount');

    const outOfStock = await Product.countDocuments({ stock: 0, isActive: true });
    const lowStock = await Product.countDocuments({ stock: { $lte: 10, $gt: 0 }, isActive: true });
    const inStock = await Product.countDocuments({ stock: { $gt: 10 }, isActive: true });

    res.json({
      success: true,
      data: {
        stockStatus: {
          outOfStock,
          lowStock,
          inStock,
        },
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderLogs = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
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
