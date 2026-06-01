const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const signalRepository = require('../repositories/signalRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const marketService = require('../services/marketService');

// Mock dependencies
jest.mock('../repositories/signalRepository');
jest.mock('../repositories/auditLogRepository');
jest.mock('../services/marketService');

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_158329';

describe('Signals and Market APIs', () => {
  let mockUserToken;
  let mockAdminToken;
  const userId = 'user-uuid-abc';
  const adminId = 'admin-uuid-xyz';

  beforeAll(() => {
    // Generate valid tokens for test execution
    mockUserToken = jwt.sign(
      { id: userId, email: 'user@example.com', role: 'USER' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    mockAdminToken = jwt.sign(
      { id: adminId, email: 'admin@example.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Signal CRUD Operations (/api/v1/signals)', () => {
    const validSignalBody = {
      assetSymbol: 'BTC',
      signalType: 'BUY',
      entryPrice: 67000.5,
      targetPrice: 72000,
      stopLoss: 65000,
      notes: 'Test breakout entry',
    };

    describe('POST /', () => {
      it('should reject requests with 401 if access token is missing', async () => {
        const response = await request(app)
          .post('/api/v1/signals')
          .send(validSignalBody);

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });

      it('should create a signal and return 201 for an authenticated user', async () => {
        signalRepository.create.mockResolvedValue({
          id: 'd3b07384-d113-4956-a5db-2c5b7b9c9f0b',
          ...validSignalBody,
          status: 'OPEN',
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        auditLogRepository.create.mockResolvedValue({});

        const response = await request(app)
          .post('/api/v1/signals')
          .set('Authorization', `Bearer ${mockUserToken}`)
          .send(validSignalBody);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.signal.assetSymbol).toBe('BTC');
        expect(signalRepository.create).toHaveBeenCalledTimes(1);
        expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
      });

      it('should reject creation with 400 if validation fails (e.g. symbol lowercase)', async () => {
        const invalidBody = {
          ...validSignalBody,
          assetSymbol: 'btc', // Must be uppercase
        };

        const response = await request(app)
          .post('/api/v1/signals')
          .set('Authorization', `Bearer ${mockUserToken}`)
          .send(invalidBody);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });

    describe('GET /:id', () => {
      it('should allow retrieval of a signal if the user owns it', async () => {
        const mockSignal = {
          id: 'd3b07384-d113-4956-a5db-2c5b7b9c9f0b',
          assetSymbol: 'BTC',
          userId: userId, // Match user ID
        };
        signalRepository.findById.mockResolvedValue(mockSignal);

        const response = await request(app)
          .get(`/api/v1/signals/${mockSignal.id}`)
          .set('Authorization', `Bearer ${mockUserToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.signal.id).toBe(mockSignal.id);
      });

      it('should reject retrieval with 403 if the signal belongs to another user', async () => {
        const mockSignal = {
          id: 'd3b07384-d113-4956-a5db-2c5b7b9c9f0b',
          assetSymbol: 'BTC',
          userId: 'other-user-uuid', // Different user ID
        };
        signalRepository.findById.mockResolvedValue(mockSignal);

        const response = await request(app)
          .get(`/api/v1/signals/${mockSignal.id}`)
          .set('Authorization', `Bearer ${mockUserToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Forbidden');
      });

      it('should allow admin users to view any user signal', async () => {
        const mockSignal = {
          id: 'd3b07384-d113-4956-a5db-2c5b7b9c9f0b',
          assetSymbol: 'BTC',
          userId: 'some-other-user',
        };
        signalRepository.findById.mockResolvedValue(mockSignal);

        const response = await request(app)
          .get(`/api/v1/signals/${mockSignal.id}`)
          .set('Authorization', `Bearer ${mockAdminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Market Live Price Lookup (/api/v1/market)', () => {
    describe('GET /price/:symbol', () => {
      it('should fetch the live price successfully and return 200', async () => {
        const mockPriceResponse = {
          symbol: 'BTC',
          price: 68432.12,
          currency: 'USD',
          source: 'Binance API',
        };
        marketService.getLivePrice.mockResolvedValue(mockPriceResponse);

        const response = await request(app)
          .get('/api/v1/market/price/BTC');

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.price).toBe(68432.12);
        expect(response.body.data.symbol).toBe('BTC');
      });

      it('should return 400 if the symbol format is invalid', async () => {
        const response = await request(app)
          .get('/api/v1/market/price/BTC-USD-!'); // non-alphanumeric

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
