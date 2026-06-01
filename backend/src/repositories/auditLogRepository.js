const prisma = require('../config/prisma');

const auditLogRepository = {
  async create(data) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
      },
    });
  },

  async findAll() {
    return prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  },

  async countAll() {
    return prisma.auditLog.count();
  },
};

module.exports = auditLogRepository;
