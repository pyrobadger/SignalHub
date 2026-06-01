const prisma = require('../config/prisma');

const refreshTokenRepository = {
  async create(data) {
    return prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  },

  async findByToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  async deleteByToken(token) {
    return prisma.refreshToken.delete({
      where: { token },
    }).catch(() => null); // Ignore if already deleted
  },

  async deleteAllByUserId(userId) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  },
};

module.exports = refreshTokenRepository;
