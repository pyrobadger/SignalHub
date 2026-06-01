const prisma = require('../config/prisma');

const userRepository = {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  async create(data) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
    });
  },

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};

module.exports = userRepository;
