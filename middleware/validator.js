export const validateProduct = (req, res, next) => {
  // Parse the data from req.body.data (sent as JSON string from FormData)
  let productData;
  try {
    productData = JSON.parse(req.body.data || '{}');
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product data format',
    });
  }

  const { name, description, price, category, stock } = productData;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Product name is required',
    });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Product description is required',
    });
  }

  if (!price || price < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid price is required',
    });
  }

  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Category is required',
    });
  }

  if (stock === undefined || stock < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid stock quantity is required',
    });
  }

  next();
};

export const validateCoupon = (req, res, next) => {
  const { code, discountType, discountValue, validFrom, validUntil } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Coupon code is required',
    });
  }

  if (!discountType || !['percentage', 'fixed'].includes(discountType)) {
    return res.status(400).json({
      success: false,
      message: 'Valid discount type is required (percentage or fixed)',
    });
  }

  if (!discountValue || discountValue <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid discount value is required',
    });
  }

  if (discountType === 'percentage' && discountValue > 100) {
    return res.status(400).json({
      success: false,
      message: 'Percentage discount cannot exceed 100',
    });
  }

  if (!validFrom || !validUntil) {
    return res.status(400).json({
      success: false,
      message: 'Valid from and valid until dates are required',
    });
  }

  if (new Date(validFrom) >= new Date(validUntil)) {
    return res.status(400).json({
      success: false,
      message: 'Valid until date must be after valid from date',
    });
  }

  next();
};
