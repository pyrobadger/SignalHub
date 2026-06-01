const prisma = require('../config/prisma');

const signalRepository = {
  async findById(id) {
    return prisma.signal.findUnique({
      where: { id },
    });
  },

  async findAllByUserId(userId) {
    return prisma.signal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data) {
    return prisma.signal.create({
      data,
    });
  },

  async update(id, data) {
    return prisma.signal.update({
      where: { id },
      data,
    });
  },

  async delete(id) {
    return prisma.signal.delete({
      where: { id },
    });
  },

  async countAll() {
    return prisma.signal.count();
  },

  async countOpen() {
    return prisma.signal.count({
      where: { status: 'OPEN' },
    });
  },
};

module.exports = signalRepository;
