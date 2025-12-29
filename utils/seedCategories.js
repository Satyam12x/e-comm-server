import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import connectDB from '../config/database.js';

dotenv.config();

const categories = [
  { name: 'Processors', slug: 'processors', description: 'CPUs from Intel and AMD' },
  { name: 'Graphics Cards', slug: 'graphics-cards', description: 'NVIDIA and AMD GPUs' },
  { name: 'Motherboards', slug: 'motherboards', description: 'Intel and AMD Motherboards' },
  { name: 'Memory', slug: 'memory', description: 'DDR4 and DDR5 RAM' },
  { name: 'Storage', slug: 'storage', description: 'SSDs, NVMe, and HDDs' },
  { name: 'Power Supplies', slug: 'power-supplies', description: 'Modular and Non-modular PSUs' },
  { name: 'Cases', slug: 'cases', description: 'ATX, Micro-ATX, and ITX Cabinets' },
  { name: 'Cooling', slug: 'cooling', description: 'Air and Liquid Coolers' },
  { name: 'Peripherals', slug: 'peripherals', description: 'Keyboards, Mice, and Headsets' },
  { name: 'Monitors', slug: 'monitors', description: 'Gaming and Professional Monitors' }
];

const seedCategories = async () => {
  try {
    await connectDB();
    
    // Clear existing categories (optional, or just upsert)
    // await Category.deleteMany({});
    
    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
    }
    
    console.log('✅ Categories seeded successfully');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
