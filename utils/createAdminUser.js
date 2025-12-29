import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Create or update admin user from environment variables
 * This runs on server startup
 */
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.warn('⚠️  Admin credentials not configured in environment variables');
      return;
    }

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      // Update password if it changed
      admin.password = adminPassword;
      admin.role = 'admin';
      await admin.save();
      logger.info(`✅ Admin user updated: ${adminEmail}`);
    } else {
      // Create new admin
      admin = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      logger.info(`✅ Admin user created: ${adminEmail}`);
    }
  } catch (error) {
    logger.error('❌ Failed to create/update admin user:', error);
  }
};

export default createAdminUser;
