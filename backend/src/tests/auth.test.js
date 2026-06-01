const request = require('supertest');
const app = require('../app');
const userRepository = require('../repositories/userRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const bcrypt = require('bcryptjs');

// Mock Repositories to isolate controllers/routing logic from database connection
jest.mock('../repositories/userRepository');
jest.mock('../repositories/auditLogRepository');
jest.mock('../repositories/refreshTokenRepository');

describe('Authentication API Endpoints (/api/v1/auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    const mockUserBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully register a new user and return 201', async () => {
      // Mock repository behavior
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        id: 'user-uuid-12345',
        name: mockUserBody.name,
        email: mockUserBody.email.toLowerCase(),
        password: 'hashed-mock-password',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      auditLogRepository.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(mockUserBody);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(mockUserBody.email.toLowerCase());
      expect(response.body.data.user.password).toBeUndefined(); // Excluded security check
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should return 409 Conflict if the email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'existing-id' });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(mockUserBody);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email address already exists');
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should return 400 Bad Request on invalid inputs (Zod Error)', async () => {
      const invalidBody = {
        name: 'A', // too short
        email: 'not-an-email', // invalid email
        password: '123', // too short
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidBody);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(3);
    });
  });

  describe('POST /login', () => {
    const mockCredentials = {
      email: 'login@example.com',
      password: 'CorrectPassword123',
    };

    it('should successfully log in the user and return access/refresh tokens', async () => {
      const mockHashedPassword = await bcrypt.hash(mockCredentials.password, 10);
      userRepository.findByEmail.mockResolvedValue({
        id: 'user-uuid-999',
        name: 'Login User',
        email: mockCredentials.email.toLowerCase(),
        password: mockHashedPassword,
        role: 'USER',
      });
      refreshTokenRepository.create.mockResolvedValue({});
      auditLogRepository.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(mockCredentials);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(mockCredentials.email.toLowerCase());
      expect(refreshTokenRepository.create).toHaveBeenCalledTimes(1);
      expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should return 401 Unauthorized if the user does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(mockCredentials);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 401 Unauthorized on incorrect password mismatch', async () => {
      userRepository.findByEmail.mockResolvedValue({
        id: 'user-uuid-999',
        email: mockCredentials.email,
        password: 'hashed-other-password-12345',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(mockCredentials);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
