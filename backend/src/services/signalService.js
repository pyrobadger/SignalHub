const signalRepository = require('../repositories/signalRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');

const signalService = {
  async createSignal(userId, data) {
    const signal = await signalRepository.create({
      assetSymbol: data.assetSymbol.toUpperCase(),
      signalType: data.signalType,
      entryPrice: parseFloat(data.entryPrice),
      targetPrice: parseFloat(data.targetPrice),
      stopLoss: parseFloat(data.stopLoss),
      status: data.status || 'OPEN',
      notes: data.notes || null,
      userId: userId,
    });

    // Write audit log
    await auditLogRepository.create({
      userId,
      action: 'SIGNAL_CREATED',
      entity: 'Signal',
      entityId: signal.id,
    });

    return signal;
  },

  async getSignalsByUser(userId) {
    return signalRepository.findAllByUserId(userId);
  },

  async getSignalById(userId, signalId, userRole) {
    const signal = await signalRepository.findById(signalId);
    if (!signal) {
      throw new AppError('Trading signal not found.', 404);
    }

    // Security check: must be owner or admin
    if (signal.userId !== userId && userRole !== 'ADMIN') {
      throw new AppError('Forbidden. You do not have permission to view this signal.', 403);
    }

    return signal;
  },

  async updateSignal(userId, signalId, data, userRole) {
    const signal = await signalRepository.findById(signalId);
    if (!signal) {
      throw new AppError('Trading signal not found.', 404);
    }

    // Security check: must be owner or admin
    if (signal.userId !== userId && userRole !== 'ADMIN') {
      throw new AppError('Forbidden. You do not have permission to update this signal.', 403);
    }

    const updatedData = {
      ...(data.assetSymbol && { assetSymbol: data.assetSymbol.toUpperCase() }),
      ...(data.signalType && { signalType: data.signalType }),
      ...(data.entryPrice !== undefined && { entryPrice: parseFloat(data.entryPrice) }),
      ...(data.targetPrice !== undefined && { targetPrice: parseFloat(data.targetPrice) }),
      ...(data.stopLoss !== undefined && { stopLoss: parseFloat(data.stopLoss) }),
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };

    const updatedSignal = await signalRepository.update(signalId, updatedData);

    // Write audit log
    await auditLogRepository.create({
      userId,
      action: 'SIGNAL_UPDATED',
      entity: 'Signal',
      entityId: signalId,
    });

    return updatedSignal;
  },

  async deleteSignal(userId, signalId, userRole) {
    const signal = await signalRepository.findById(signalId);
    if (!signal) {
      throw new AppError('Trading signal not found.', 404);
    }

    // Security check: must be owner or admin
    if (signal.userId !== userId && userRole !== 'ADMIN') {
      throw new AppError('Forbidden. You do not have permission to delete this signal.', 403);
    }

    await signalRepository.delete(signalId);

    // Write audit log
    await auditLogRepository.create({
      userId,
      action: 'SIGNAL_DELETED',
      entity: 'Signal',
      entityId: signalId,
    });

    return true;
  },
};

module.exports = signalService;
