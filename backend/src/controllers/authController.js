const authService = require('../services/authService');
const logger = require('../config/winston');

const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const user = await authService.register(name, email, password);

      logger.info(`User Registered: ${email}`, {
        correlationId: req.correlationId,
        endpoint: '/api/v1/auth/register',
        userId: user.id,
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      logger.info(`User Logged In: ${email}`, {
        correlationId: req.correlationId,
        endpoint: '/api/v1/auth/login',
        userId: result.user.id,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
