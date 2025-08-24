const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password, firstName, lastName, organizationName, organizationDomain } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Create organization first
      const organization = new Organization({
        name: organizationName,
        domain: organizationDomain,
        ownerId: null // Will be updated after user creation
      });

      const savedOrganization = await organization.save();

      // Create user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        organizationId: savedOrganization._id,
        role: 'admin'
      });

      const savedUser = await user.save();

      // Update organization with owner
      savedOrganization.ownerId = savedUser._id;
      await savedOrganization.save();

      // Generate tokens
      const accessToken = savedUser.generateAuthToken();
      const refreshToken = savedUser.generateRefreshToken();
      await savedUser.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          organizationId: savedUser.organizationId
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user and populate organization
      const user = await User.findOne({ email, isActive: true })
        .populate('organizationId', 'name domain plan');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();

      // Generate tokens
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      
      await user.save();

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          organizationId: user.organizationId._id,
          organization: {
            name: user.organizationId.name,
            domain: user.organizationId.domain,
            plan: user.organizationId.plan
          }
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Find user and check if refresh token exists
      const user = await User.findById(decoded.userId);
      if (!user || !user.refreshTokens.some(token => token.token === refreshToken)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const newAccessToken = user.generateAuthToken();

      res.json({
        success: true,
        accessToken: newAccessToken
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const user = await User.findById(req.user.userId);

      if (user && refreshToken) {
        user.refreshTokens = user.refreshTokens.filter(
          token => token.token !== refreshToken
        );
        await user.save();
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error during logout'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password -refreshTokens')
        .populate('organizationId', 'name domain plan')
        .populate('teams', 'name description');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = new AuthController();