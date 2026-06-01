const signalService = require('../services/signalService');
const logger = require('../config/winston');

const signalController = {
  async createSignal(req, res, next) {
    try {
      const userId = req.user.id;
      const signal = await signalService.createSignal(userId, req.body);

      logger.info('Signal Created', {
        correlationId: req.correlationId,
        endpoint: '/api/v1/signals',
        userId,
        signalId: signal.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Signal created successfully.',
        data: { signal },
      });
    } catch (error) {
      next(error);
    }
  },

  async getSignals(req, res, next) {
    try {
      const userId = req.user.id;
      const signals = await signalService.getSignalsByUser(userId);

      return res.status(200).json({
        success: true,
        message: 'Signals retrieved successfully.',
        data: { signals },
      });
    } catch (error) {
      next(error);
    }
  },

  async getSignalById(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const signalId = req.params.id;
      
      const signal = await signalService.getSignalById(userId, signalId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Signal retrieved successfully.',
        data: { signal },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSignal(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const signalId = req.params.id;

      const signal = await signalService.updateSignal(userId, signalId, req.body, userRole);

      logger.info('Signal Updated', {
        correlationId: req.correlationId,
        endpoint: `/api/v1/signals/${signalId}`,
        userId,
        signalId,
      });

      return res.status(200).json({
        success: true,
        message: 'Signal updated successfully.',
        data: { signal },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteSignal(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const signalId = req.params.id;

      await signalService.deleteSignal(userId, signalId, userRole);

      logger.info('Signal Deleted', {
        correlationId: req.correlationId,
        endpoint: `/api/v1/signals/${signalId}`,
        userId,
        signalId,
      });

      return res.status(200).json({
        success: true,
        message: 'Signal deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = signalController;
