import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    coupon: {
      code: String,
      discount: Number,
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  if (this.coupon && this.coupon.discount) {
    if (this.coupon.discountType === 'percentage') {
      this.discount = (this.subtotal * this.coupon.discount) / 100;
    } else {
      this.discount = this.coupon.discount;
    }
  } else {
    this.discount = 0;
  }

  // Calculate Tax (18% GST)
  this.tax = this.subtotal * 0.18;
  
  // Total = Subtotal - Discount + Tax
  this.total = Math.max(0, this.subtotal - this.discount + this.tax);
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
