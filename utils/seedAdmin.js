import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.error('Admin email and password must be set in environment variables');
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      logger.info('Admin user already exists');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    logger.info(`Admin user created successfully: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
