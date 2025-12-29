import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import logger from '../config/logger.js';
import { sendOTP } from '../utils/emailService.js';
import { generateOTP, storeOTP, verifyOTP as verifyOTPCode, hasOTP, deleteOTP } from '../utils/otpService.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Check if email credentials are configured
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (emailConfigured) {
      // OTP flow - send email
      const otp = generateOTP();
      storeOTP(email, otp);

      try {
        await sendOTP(email, otp);
        logger.info(`OTP sent to: ${email}`);

        res.status(200).json({
          success: true,
          message: 'Verification code sent to your email',
          data: {
            email,
            name,
            pendingVerification: true
          },
        });
      } catch (emailError) {
        deleteOTP(email);
        logger.error('Email sending failed, falling back to direct registration');
        
        // Fallback: Create user directly if email fails
        const user = await User.create({
          name,
          email,
          password,
          phone,
          role: 'customer',
        });

        const token = generateToken(user._id);
        logger.info(`New user registered (email failed): ${user.email}`);

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
            },
            token,
          },
        });
      }
    } else {
      // No email configured - create user directly
      const user = await User.create({
        name,
        email,
        password,
        phone,
        role: 'customer',
      });

      const token = generateToken(user._id);
      logger.info(`New user registered (no email config): ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          token,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Verify OTP and complete registration
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp, name, password, phone } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    // Verify OTP
    const verification = verifyOTPCode(email, otp);

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message,
      });
    }

    // Check if user already exists (shouldn't happen but safety check)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'customer',
    });

    const token = generateToken(user._id);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already registered',
      });
    }

    // Delete old OTP if exists
    if (hasOTP(email)) {
      deleteOTP(email);
    }

    // Generate new OTP
    const otp = generateOTP();
    storeOTP(email, otp);

    try {
      await sendOTP(email, otp);
    } catch (emailError) {
      deleteOTP(email);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
      });
    }

    logger.info(`OTP resent to: ${email}`);

    res.json({
      success: true,
      message: 'Verification code resent to your email',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email, role: 'admin' });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    const token = generateToken(user._id);

    logger.info(`Admin logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push(req.body);
    await user.save();

    logger.info(`Address added for user: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    Object.assign(address, req.body);
    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    user.addresses = user.addresses.filter((addr) => addr._id.toString() !== addressId);
    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    next(error);
  }
};
