const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required. Please authenticate.', 401);
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          throw new AppError('Access token has expired. Please refresh.', 401);
        }
        throw new AppError('Invalid access token.', 401);
      }
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      
      next();
    });
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated.', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('Forbidden. You do not have permission to access this resource.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
};
