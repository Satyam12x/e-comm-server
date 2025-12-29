import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { cloudinary } from '../config/cloudinary.js';
import logger from '../config/logger.js';

const uploadToCloudinary = async (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });
};

export const createProduct = async (req, res, next) => {
  try {
    const productData = JSON.parse(req.body.data || '{}');
    const images = [];
    let model3D = null;

    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file, 'products/images');
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }

    if (req.files?.model3D && req.files.model3D[0]) {
      const result = await uploadToCloudinary(req.files.model3D[0], 'products/models');
      model3D = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    // Generate slug from name if not provided
    if (!productData.slug && productData.name) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
    }

    const product = await Product.create({
      ...productData,
      images,
      model3D,
    });

    logger.info(`Product created: ${product.name}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    logger.error(`Product creation failed: ${error.message}`);
    logger.error(`Product data: ${JSON.stringify(req.body.data)}`);
    next(error);
  }
};

export const getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      featured,
    } = req.query;

    const query = { isActive: true };

    // Handle category filtering - support both ObjectId and slug
    if (category) {
      // First, try to find category by slug
      const categoryDoc = await Category.findOne({ 
        $or: [
          { slug: category },
          { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }
        ]
      });
      
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // If no category found, try to match by ObjectId directly
        if (category.match(/^[0-9a-fA-F]{24}$/)) {
          query.category = category;
        }
      }
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Map frontend sort options to MongoDB sort expressions
    let sortOption = sort;
    switch (sort) {
      case 'price-asc':
        sortOption = 'price';
        break;
      case 'price-desc':
        sortOption = '-price';
        break;
      case 'newest':
        sortOption = '-createdAt';
        break;
      case 'recommended':
      default:
        sortOption = '-viewCount -rating.average -createdAt';
        break;
    }

    const products = await Product.find(query)
      .populate('category')
      .sort(sortOption)
      .limit(Number(limit))
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
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

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'name email' },
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.viewCount += 1;
    await product.save();

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category')
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'name email' },
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.viewCount += 1;
    await product.save();

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const productData = JSON.parse(req.body.data || '{}');
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (req.files?.images) {
      for (const img of product.images) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }

      const images = [];
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file, 'products/images');
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
      productData.images = images;
    }

    if (req.files?.model3D && req.files.model3D[0]) {
      if (product.model3D?.publicId) {
        await cloudinary.uploader.destroy(product.model3D.publicId);
      }

      const result = await uploadToCloudinary(req.files.model3D[0], 'products/models');
      productData.model3D = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    Object.assign(product, productData);
    await product.save();

    logger.info(`Product updated: ${product.name}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    for (const img of product.images) {
      if (img.publicId) {
        await cloudinary.uploader.destroy(img.publicId);
      }
    }

    if (product.model3D?.publicId) {
      await cloudinary.uploader.destroy(product.model3D.publicId);
    }

    await product.deleteOne();

    logger.info(`Product deleted: ${product.name}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
