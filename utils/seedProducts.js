import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import logger from '../config/logger.js';

dotenv.config();

const categories = [
  {
    name: 'Processors',
    description: 'CPUs and processors for desktops and workstations',
  },
  {
    name: 'Graphics Cards',
    description: 'GPUs for gaming and professional work',
  },
  {
    name: 'Motherboards',
    description: 'Motherboards for various CPU sockets',
  },
  {
    name: 'RAM',
    description: 'Memory modules DDR4 and DDR5',
  },
  {
    name: 'Storage',
    description: 'SSDs, HDDs, and NVMe drives',
  },
  {
    name: 'Power Supply',
    description: 'PSUs for various wattage requirements',
  },
];

const products = [
  {
    name: 'Intel Core i9-13900K',
    shortDescription: '24-Core Desktop Processor',
    description: 'Intel Core i9-13900K Desktop Processor 24 cores (8 P-cores + 16 E-cores) with up to 5.8 GHz unlocked',
    price: 54999,
    comparePrice: 64999,
    categoryName: 'Processors',
    brand: 'Intel',
    sku: 'INTEL-i9-13900K',
    stock: 15,
    specifications: [
      { key: 'Cores', value: '24 (8P+16E)' },
      { key: 'Threads', value: '32' },
      { key: 'Base Clock', value: '3.0 GHz' },
      { key: 'Boost Clock', value: '5.8 GHz' },
      { key: 'Socket', value: 'LGA 1700' },
      { key: 'TDP', value: '125W' },
    ],
    features: [
      'Unlocked for overclocking',
      'Intel Turbo Boost Max Technology 3.0',
      'PCIe 5.0 and 4.0 support',
      'DDR5 and DDR4 support',
    ],
    tags: ['processor', 'intel', 'gaming', 'high-performance'],
    isFeatured: true,
  },
  {
    name: 'AMD Ryzen 9 7950X',
    shortDescription: '16-Core, 32-Thread Desktop Processor',
    description: 'AMD Ryzen 9 7950X 16-Core, 32-Thread Unlocked Desktop Processor',
    price: 52999,
    comparePrice: 62999,
    categoryName: 'Processors',
    brand: 'AMD',
    sku: 'AMD-R9-7950X',
    stock: 12,
    specifications: [
      { key: 'Cores', value: '16' },
      { key: 'Threads', value: '32' },
      { key: 'Base Clock', value: '4.5 GHz' },
      { key: 'Boost Clock', value: '5.7 GHz' },
      { key: 'Socket', value: 'AM5' },
      { key: 'TDP', value: '170W' },
    ],
    features: [
      'Unlocked for overclocking',
      'AMD 3D V-Cache Technology Ready',
      'PCIe 5.0 support',
      'DDR5 memory support',
    ],
    tags: ['processor', 'amd', 'ryzen', 'high-performance'],
    isFeatured: true,
  },
  {
    name: 'NVIDIA RTX 4090',
    shortDescription: '24GB GDDR6X Graphics Card',
    description: 'NVIDIA GeForce RTX 4090 24GB GDDR6X - The Ultimate Graphics Card',
    price: 154999,
    comparePrice: 174999,
    categoryName: 'Graphics Cards',
    brand: 'NVIDIA',
    sku: 'NV-RTX4090',
    stock: 8,
    specifications: [
      { key: 'CUDA Cores', value: '16384' },
      { key: 'Memory', value: '24GB GDDR6X' },
      { key: 'Memory Bus', value: '384-bit' },
      { key: 'Boost Clock', value: '2.52 GHz' },
      { key: 'Power', value: '450W TDP' },
    ],
    features: [
      'Ray Tracing technology',
      'DLSS 3.0 support',
      'PCIe 4.0 interface',
      '8K gaming ready',
    ],
    tags: ['gpu', 'nvidia', 'rtx', 'gaming', '4k'],
    isFeatured: true,
  },
  {
    name: 'AMD Radeon RX 7900 XTX',
    shortDescription: '24GB GDDR6 Graphics Card',
    description: 'AMD Radeon RX 7900 XTX 24GB GDDR6 - High Performance Gaming',
    price: 89999,
    comparePrice: 99999,
    categoryName: 'Graphics Cards',
    brand: 'AMD',
    sku: 'AMD-RX7900XTX',
    stock: 10,
    specifications: [
      { key: 'Stream Processors', value: '6144' },
      { key: 'Memory', value: '24GB GDDR6' },
      { key: 'Memory Bus', value: '384-bit' },
      { key: 'Game Clock', value: '2.3 GHz' },
      { key: 'Power', value: '355W TDP' },
    ],
    features: [
      'AMD RDNA 3 Architecture',
      'Ray Tracing support',
      'PCIe 4.0 support',
      'FSR 3.0 compatible',
    ],
    tags: ['gpu', 'amd', 'radeon', 'gaming'],
    isFeatured: true,
  },
  {
    name: 'ASUS ROG Strix Z790-E',
    shortDescription: 'ATX Gaming Motherboard',
    description: 'ASUS ROG Strix Z790-E Gaming WiFi ATX LGA1700 Motherboard',
    price: 42999,
    comparePrice: 49999,
    categoryName: 'Motherboards',
    brand: 'ASUS',
    sku: 'ASUS-Z790E',
    stock: 7,
    specifications: [
      { key: 'Socket', value: 'LGA 1700' },
      { key: 'Chipset', value: 'Intel Z790' },
      { key: 'Form Factor', value: 'ATX' },
      { key: 'Memory Slots', value: '4 x DDR5' },
      { key: 'Max Memory', value: '128GB' },
    ],
    features: [
      'WiFi 6E included',
      'PCIe 5.0 support',
      'Thunderbolt 4 support',
      'RGB Aura Sync',
    ],
    tags: ['motherboard', 'asus', 'gaming', 'intel'],
    isFeatured: false,
  },
  {
    name: 'Corsair Vengeance DDR5 32GB',
    shortDescription: '32GB (2x16GB) DDR5-6000MHz',
    description: 'Corsair Vengeance DDR5 RAM 32GB (2x16GB) 6000MHz C36',
    price: 12999,
    comparePrice: 14999,
    categoryName: 'RAM',
    brand: 'Corsair',
    sku: 'CORS-DDR5-32',
    stock: 25,
    specifications: [
      { key: 'Capacity', value: '32GB (2x16GB)' },
      { key: 'Type', value: 'DDR5' },
      { key: 'Speed', value: '6000MHz' },
      { key: 'Latency', value: 'CL36' },
      { key: 'Voltage', value: '1.35V' },
    ],
    features: [
      'Optimized for Intel and AMD',
      'Low latency performance',
      'Heat spreader included',
      'Lifetime warranty',
    ],
    tags: ['ram', 'memory', 'ddr5', 'corsair'],
    isFeatured: false,
  },
  {
    name: 'Samsung 990 PRO 2TB',
    shortDescription: '2TB NVMe M.2 SSD',
    description: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 Internal SSD',
    price: 18999,
    comparePrice: 22999,
    categoryName: 'Storage',
    brand: 'Samsung',
    sku: 'SAM-990PRO-2TB',
    stock: 20,
    specifications: [
      { key: 'Capacity', value: '2TB' },
      { key: 'Interface', value: 'PCIe 4.0 x4 NVMe' },
      { key: 'Form Factor', value: 'M.2 2280' },
      { key: 'Read Speed', value: '7450 MB/s' },
      { key: 'Write Speed', value: '6900 MB/s' },
    ],
    features: [
      'Heatsink included',
      'Dynamic Thermal Guard',
      'Magician software',
      '5-year warranty',
    ],
    tags: ['ssd', 'nvme', 'samsung', 'storage'],
    isFeatured: true,
  },
  {
    name: 'Corsair RM850x 850W',
    shortDescription: '850W 80+ Gold Modular PSU',
    description: 'Corsair RM850x 850W 80 PLUS Gold Fully Modular Power Supply',
    price: 11999,
    comparePrice: 13999,
    categoryName: 'Power Supply',
    brand: 'Corsair',
    sku: 'CORS-RM850X',
    stock: 15,
    specifications: [
      { key: 'Wattage', value: '850W' },
      { key: 'Efficiency', value: '80+ Gold' },
      { key: 'Modular', value: 'Fully Modular' },
      { key: 'Fan Size', value: '135mm' },
      { key: 'Protection', value: 'OVP, UVP, SCP, OPP, OTP' },
    ],
    features: [
      'Zero RPM fan mode',
      '105°C rated capacitors',
      'quiet operation',
      '10-year warranty',
    ],
    tags: ['psu', 'power-supply', 'corsair', 'modular'],
    isFeatured: false,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    await Category.deleteMany({});
    await Product.deleteMany({});

    logger.info('Existing data cleared');

    const categoriesWithSlugs = categories.map(cat => ({
      ...cat,
      slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
    }));

    const createdCategories = await Category.insertMany(categoriesWithSlugs);
    logger.info(`${createdCategories.length} categories created`);

    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    const productsWithCategories = products.map((product) => ({
      ...product,
      category: categoryMap[product.categoryName],
      slug: product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    }));

    productsWithCategories.forEach((p) => delete p.categoryName);

    const createdProducts = await Product.insertMany(productsWithCategories);
    logger.info(`${createdProducts.length} products created`);

    logger.info('Database seeded successfully!');
    logger.info(`Categories: ${createdCategories.map(c => c.name).join(', ')}`);
    logger.info(`Products: ${createdProducts.map(p => p.name).join(', ')}`);
    
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

seedProducts();
