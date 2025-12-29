import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed'],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.methods.isValid = function (userId, orderAmount) {
  const now = new Date();
  
  if (!this.isActive) {
    return { valid: false, message: 'Coupon is not active' };
  }
  
  if (now < this.validFrom) {
    return { valid: false, message: 'Coupon is not yet valid' };
  }
  
  if (now > this.validUntil) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount is ₹${this.minOrderAmount}` };
  }
  
  if (userId && this.usedBy.some(entry => entry.user.toString() === userId.toString())) {
    return { valid: false, message: 'You have already used this coupon' };
  }
  
  return { valid: true, message: 'Coupon is valid' };
};

couponSchema.methods.calculateDiscount = function (amount) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (amount * this.discountValue) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else {
    discount = this.discountValue;
  }
  
  return Math.min(discount, amount);
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
