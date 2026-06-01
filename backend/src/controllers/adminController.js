const userRepository = require('../repositories/userRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const signalRepository = require('../repositories/signalRepository');
const logger = require('../config/winston');

const adminController = {
  async getUsers(req, res, next) {
    try {
      const users = await userRepository.findAll();
      
      logger.info('Admin User Directory Accessed', {
        correlationId: req.correlationId,
        endpoint: '/api/v1/admin/users',
        userId: req.user.id,
      });

      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully.',
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const auditLogs = await auditLogRepository.findAll();

      logger.info('Admin Audit Logs Directory Accessed', {
        correlationId: req.correlationId,
        endpoint: '/api/v1/admin/audit-logs',
        userId: req.user.id,
      });

      return res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully.',
        data: { auditLogs },
      });
    } catch (error) {
      next(error);
    }
  },

  // Bonus/Admin: Get Platform activity/metrics overview
  async getPlatformMetrics(req, res, next) {
    try {
      const users = await userRepository.findAll();
      const totalUsers = users.length;
      const totalSignals = await signalRepository.countAll();
      const openSignals = await signalRepository.countOpen();
      const totalLogs = await auditLogRepository.countAll();

      return res.status(200).json({
        success: true,
        message: 'Platform metrics retrieved successfully.',
        data: {
          metrics: {
            totalUsers,
            totalSignals,
            openSignals,
            totalLogs,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage().heapUsed,
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;
