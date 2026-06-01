const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');

const authService = {
  // Generate Access Token (15 min)
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
    );
  },

  // Generate Refresh Token (7 days)
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );
  },

  async register(name, email, password) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('A user with this email address already exists.', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: 'USER', // Default role
    });

    // Write audit log
    await auditLogRepository.create({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: newUser.id,
    });

    // Exclude password from returned user object
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  async login(email, password) {
    // Check if user exists
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save refresh token to database
    await refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    // Write audit log
    await auditLogRepository.create({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
    });

    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  },

  async refresh(token) {
    if (!token) {
      throw new AppError('Refresh token is required.', 400);
    }

    // Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    // Verify database record
    const dbToken = await refreshTokenRepository.findByToken(token);
    if (!dbToken) {
      throw new AppError('Invalid refresh token session.', 401);
    }

    // Verify expiry in DB
    if (new Date() > dbToken.expiresAt) {
      await refreshTokenRepository.deleteByToken(token);
      throw new AppError('Refresh token has expired. Please log in again.', 401);
    }

    // Load active user
    const user = dbToken.user;
    if (!user) {
      throw new AppError('User not found associated with this token.', 401);
    }

    // Rotate Refresh Token: delete the old one and generate a new one
    await refreshTokenRepository.deleteByToken(token);

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Set new expiry (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save new refresh token
    await refreshTokenRepository.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(token) {
    if (!token) {
      throw new AppError('Refresh token is required to log out.', 400);
    }

    // Find token details
    const dbToken = await refreshTokenRepository.findByToken(token);
    
    if (dbToken) {
      // Write audit log
      await auditLogRepository.create({
        userId: dbToken.userId,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: dbToken.userId,
      });

      // Delete token from database
      await refreshTokenRepository.deleteByToken(token);
    }

    return true;
  },
};

module.exports = authService;
